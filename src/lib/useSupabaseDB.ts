import { useState, useEffect, useCallback } from 'react';
import { supabase, uploadImage } from './supabase';

// Mapeamento: Nome usado no Site (Inglês) -> Nome real no Banco (Português)
const TABLE_MAP: Record<string, string> = {
  products: 'produtos',
  customers: 'clientes',
  orders: 'pedidos',
  settings: 'configuracoes',
  resellers: 'revendedores',
  resellerProducts: 'revendedor_produtos',
  resellerCustomers: 'clientes_revendedor',
  resellerSales: 'vendas_revendedor',
};

// Tradutor de Banco (PT) -> Site (EN)
const translateFromDB = (storeName: string, item: any) => {
  if (storeName === 'products') {
    return {
      id: item.id,
      name: item.nome,
      description: item.descricao,
      category: item.categoria,
      costPrice: item.preco_de_custo,
      markupPercent: item.porcentagem_de_margem,
      sellPrice: item.preco_de_venda,
      stockQuantity: item.quantidade_em_estoque,
      discountPercent: item.porcentagem_de_desconto,
      imageUrl: item.url_da_imagem,
      createdAt: item.criado_em,
    };
  }
  if (storeName === 'customers') {
    return {
      id: item.id,
      name: item.nome,
      phone: item.telefone,
      email: item.email,
      address: item.endereco,
      source: item.origem,
      createdAt: item.criado_em,
    };
  }
  if (storeName === 'orders') {
    return {
      id: item.id,
      customerName: item.nome_do_cliente,
      customerPhone: item.telefone_do_cliente,
      items: item.itens,
      totalAmount: item.valor_total,
      discountAmount: item.valor_do_desconto,
      paymentMethod: item.metodo_de_pagamento,
      notes: item.observacoes,
      status: item.status,
      createdAt: item.criado_em,
    };
  }
  if (storeName === 'settings') {
    return {
      id: item.id,
      defaultMarkup: item.margem_padrao,
      storeName: item.nome_da_loja,
      currency: item.moeda,
      whatsappNumber: item.numero_do_whatsapp,
      storeDescription: item.descricao_da_loja,
      createdAt: item.criado_em,
    };
  }
  if (storeName === 'resellers') {
    return {
      id: item.id,
      nomeCompleto: item.nome_completo,
      whatsapp: item.whatsapp,
      senha: item.senha,
      endereco: item.endereco,
      status: item.status,
      totalVendido: item.total_vendido,
      comissaoPaga: item.comissao_paga,
      comissaoAPagar: item.comissao_a_pagar,
      criadoEm: item.criado_em,
    };
  }
  if (storeName === 'resellerProducts') {
    return {
      id: item.id,
      revendedorId: item.revendedor_id,
      produtoId: item.produto_id,
      nomeProduto: item.nome_produto,
      imagemUrl: item.imagem_url,
      precoVenda: item.preco_venda,
      quantidade: item.quantidade,
      criadoEm: item.criado_em,
    };
  }
  if (storeName === 'resellerCustomers') {
    return {
      id: item.id,
      revendedorId: item.revendedor_id,
      nome: item.nome,
      whatsapp: item.whatsapp,
      endereco: item.endereco,
      criadoEm: item.criado_em,
    };
  }
  if (storeName === 'resellerSales') {
    return {
      id: item.id,
      revendedorId: item.revendedor_id,
      clienteNome: item.cliente_nome,
      clienteWhastapp: item.cliente_whatsapp,
      itens: item.itens,
      totalVenda: item.total_venda,
      comissaoPercentual: item.comissao_percentual,
      comissaoValor: item.comissao_valor,
      metodoPagamento: item.metodo_pagamento,
      parcelas: item.parcelas,
      status: item.status,
      criadoEm: item.criado_em,
    };
  }
  return item;
};

// Tradutor de Site (EN) -> Banco (PT)
const translateToDB = (storeName: string, itemData: any) => {
  const base = {
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
    url_da_imagem: itemData.imageUrl || '',
  };

  if (storeName === 'products') {
    return {
      ...base,
      nome: itemData.name,
      descricao: itemData.description,
      categoria: itemData.category,
      preco_de_custo: itemData.costPrice,
      porcentagem_de_margem: itemData.markupPercent,
      preco_de_venda: itemData.sellPrice,
      quantidade_em_estoque: itemData.stockQuantity,
      porcentagem_de_desconto: itemData.discountPercent,
    };
  }
  if (storeName === 'customers') {
    return {
      ...base,
      nome: itemData.name,
      telefone: itemData.phone,
      email: itemData.email,
      endereco: itemData.address,
      origem: itemData.source,
    };
  }
  if (storeName === 'orders') {
    return {
      ...base,
      nome_do_cliente: itemData.customerName,
      telefone_do_cliente: itemData.customerPhone,
      itens: itemData.items,
      valor_total: itemData.totalAmount,
      valor_do_desconto: itemData.discountAmount,
      metodo_de_pagamento: itemData.paymentMethod,
      observacoes: itemData.notes,
      status: itemData.status,
    };
  }
  if (storeName === 'settings') {
    return {
      ...base,
      margem_padrao: itemData.defaultMarkup,
      nome_da_loja: itemData.storeName,
      moeda: itemData.currency,
      numero_do_whatsapp: itemData.whatsappNumber,
      descricao_da_loja: itemData.storeDescription,
    };
  }
  if (storeName === 'resellers') {
    return {
      nome_completo: itemData.nomeCompleto,
      whatsapp: itemData.whatsapp,
      senha: itemData.senha,
      endereco: itemData.endereco,
      status: itemData.status || 'pendente',
      total_vendido: itemData.totalVendido || 0,
      comissao_paga: itemData.comissaoPaga || 0,
      comissao_a_pagar: itemData.comissaoAPagar || 0,
      criado_em: new Date().toISOString(),
    };
  }
  if (storeName === 'resellerProducts') {
    return {
      revendedor_id: itemData.revendedorId,
      produto_id: itemData.produtoId,
      nome_produto: itemData.nomeProduto,
      imagem_url: itemData.imagemUrl || '',
      preco_venda: itemData.precoVenda,
      quantidade: itemData.quantidade,
      criado_em: new Date().toISOString(),
    };
  }
  if (storeName === 'resellerCustomers') {
    return {
      revendedor_id: itemData.revendedorId,
      nome: itemData.nome,
      whatsapp: itemData.whatsapp,
      endereco: itemData.endereco || '',
      criado_em: new Date().toISOString(),
    };
  }
  if (storeName === 'resellerSales') {
    return {
      revendedor_id: itemData.revendedorId,
      cliente_nome: itemData.clienteNome,
      cliente_whatsapp: itemData.clienteWhastapp || '',
      itens: itemData.itens,
      total_venda: itemData.totalVenda,
      comissao_percentual: itemData.comissaoPercentual,
      comissao_valor: itemData.comissaoValor,
      metodo_pagamento: itemData.metodoPagamento,
      parcelas: itemData.parcelas || 1,
      status: itemData.status || 'concluida',
      criado_em: new Date().toISOString(),
    };
  }
  return { ...base, ...itemData };
};

export const useSupabaseDB = <T extends { id?: string }>(storeName: string) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  
  const tableName = TABLE_MAP[storeName] || storeName;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: items, error } = await supabase
        .from(tableName)
        .select('*');

      if (error) {
        console.error(`Erro Supabase (${tableName}):`, error.message, error.details);
        throw error;
      }

      const translatedItems = (items || []).map((item: any) => translateFromDB(storeName, item));
      setData(translatedItems);
    } catch (err: any) {
      console.error(`Erro ao buscar ${tableName}:`, err?.message || err);
    } finally {
      setLoading(false);
    }
  }, [tableName, storeName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const create = async (itemData: any, imageFile?: File): Promise<string | null> => {
    try {
      let imageUrl = itemData.imageUrl || '';
      if (imageFile) {
        const fileName = `${Date.now()}-${imageFile.name}`;
        imageUrl = await uploadImage(imageFile, fileName) || '';
      }

      const itemToSave = translateToDB(storeName, { ...itemData, imageUrl });
      
      const { data, error } = await supabase
        .from(tableName)
        .insert(itemToSave)
        .select()
        .single();

      if (error) throw error;
      fetchData();
      return data?.id || null;
    } catch (err) {
      console.error(`Erro ao criar em ${tableName}:`, err);
      return null;
    }
  };

  const update = async (id: string, itemData: any, imageFile?: File): Promise<void> => {
    try {
      let imageUrl = itemData.imageUrl || '';
      if (imageFile) {
        const fileName = `${Date.now()}-${imageFile.name}`;
        imageUrl = await uploadImage(imageFile, fileName) || '';
      }

      const itemToUpdate = translateToDB(storeName, { ...itemData, imageUrl });
      delete itemToUpdate.criado_em;

      const { error } = await supabase
        .from(tableName)
        .update(itemToUpdate)
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error(`Erro ao atualizar em ${tableName}:`, err);
    }
  };

  const remove = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error(`Erro ao remover em ${tableName}:`, err);
    }
  };

  return {
    data,
    loading,
    create,
    update,
    remove,
    refresh: fetchData,
  };
};

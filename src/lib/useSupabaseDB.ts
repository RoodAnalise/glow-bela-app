import { useState, useEffect, useCallback } from 'react';
import { supabase, uploadImage } from './supabase';

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

const translateFromDB = (storeName: string, item: any) => {
  if (storeName === 'products') {
    return {
      id: item.id,
      name: item.nome || item.name || '',
      description: item.descricao || item.description || '',
      category: item.categoria || item.category || '',
      costPrice: Number(item.preco_de_custo || item.cost_price || 0),
      markupPercent: Number(item.porcentagem_de_margem || item.markup_percent || 0),
      sellPrice: Number(item.preco_de_venda || item.sell_price || 0),
      stockQuantity: Number(item.quantidade_em_estoque || item.stock_quantity || 0),
      discountPercent: Number(item.porcentagem_de_desconto || item.discount_percent || 0),
      imageUrls: Array.isArray(item.urls_da_imagem) ? item.urls_da_imagem : (item.url_da_imagem ? [item.url_da_imagem] : []),
      createdAt: item.criado_em || item.created_at,
    };
  }
  if (storeName === 'customers') {
    return {
      id: item.id,
      name: item.nome || item.name || '',
      phone: item.telefone || item.phone || '',
      email: item.email || '',
      address: item.endereco || item.address || '',
      source: item.origem || item.source || 'manual',
      createdAt: item.criado_em || item.created_at,
    };
  }
  if (storeName === 'orders') {
    return {
      id: item.id,
      customerName: item.nome_do_cliente || item.customer_name || '',
      customerPhone: item.telefone_do_cliente || item.customer_phone || '',
      items: item.itens || item.items,
      totalAmount: Number(item.valor_total || item.total_amount || 0),
      discountAmount: Number(item.valor_do_desconto || item.discount_amount || 0),
      paymentMethod: item.metodo_de_pagamento || item.payment_method || '',
      notes: item.observacoes || item.notes || '',
      status: item.status || 'pending',
      createdAt: item.criado_em || item.created_at,
    };
  }
  if (storeName === 'settings') {
    return {
      id: item.id,
      defaultMarkup: Number(item.margem_padrao || item.default_markup || 50),
      storeName: item.nome_da_loja || item.store_name || 'Glow Bella',
      currency: item.moeda || item.currency || 'BRL',
      whatsappNumber: item.numero_do_whatsapp || item.whatsapp_number || '',
      storeDescription: item.descricao_da_loja || item.store_description || '',
      createdAt: item.criado_em || item.created_at,
    };
  }
  if (storeName === 'resellers') {
    return {
      id: item.id,
      nomeCompleto: item.nome_completo || item.name || '',
      whatsapp: item.whatsapp || '',
      senha: item.senha || item.password || '',
      endereco: item.endereco || item.address || '',
      status: item.status || 'pendente',
      totalVendido: Number(item.total_vendido || item.total_sold || 0),
      comissaoPaga: Number(item.comissao_paga || item.commission_paid || 0),
      comissaoAPagar: Number(item.comissao_a_pagar || item.commission_to_pay || 0),
      criadoEm: item.criado_em || item.created_at,
    };
  }
  if (storeName === 'resellerProducts') {
    return {
      id: item.id,
      revendedorId: item.revendedor_id || item.reseller_id || '',
      produtoId: item.produto_id || item.product_id || '',
      nomeProduto: item.nome_produto || item.product_name || '',
      imagemUrl: item.imagem_url || item.image_url || '',
      precoVenda: Number(item.preco_venda || item.sell_price || 0),
      quantidade: Number(item.quantidade || item.quantity || 0),
      criadoEm: item.criado_em || item.created_at,
    };
  }
  if (storeName === 'resellerCustomers') {
    return {
      id: item.id,
      revendedorId: item.revendedor_id || item.reseller_id || '',
      nome: item.nome || item.name || '',
      whatsapp: item.whatsapp || '',
      endereco: item.endereco || item.address || '',
      criadoEm: item.criado_em || item.created_at,
    };
  }
  if (storeName === 'resellerSales') {
    return {
      id: item.id,
      revendedorId: item.revendedor_id || item.reseller_id || '',
      clienteNome: item.cliente_nome || item.customer_name || '',
      clienteWhastapp: item.cliente_whatsapp || item.customer_whatsapp || '',
      itens: item.itens || item.items,
      totalVenda: Number(item.total_venda || item.total_sale || 0),
      comissaoPercentual: Number(item.comissao_percentual || item.commission_percent || 0),
      comissaoValor: Number(item.comissao_valor || item.commission_value || 0),
      metodoPagamento: item.metodo_pagamento || item.payment_method || '',
      parcelas: Number(item.parcelas || item.installments || 1),
      status: item.status || 'concluida',
      criadoEm: item.criado_em || item.created_at,
    };
  }
  return item;
};

const translateToDB = (storeName: string, itemData: any) => {
  const basePT = { criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() };
  const baseEN = { created_at: new Date().toISOString(), updated_at: new Date().toISOString() };

  if (storeName === 'products') {
    const imageUrls = Array.isArray(itemData.imageUrls) ? itemData.imageUrls : [];
    return {
      pt: { ...basePT, nome: itemData.name, descricao: itemData.description, categoria: itemData.category, preco_de_custo: itemData.costPrice, porcentagem_de_margem: itemData.markupPercent, preco_de_venda: itemData.sellPrice, quantidade_em_estoque: itemData.stockQuantity, porcentagem_de_desconto: itemData.discountPercent, urls_da_imagem: imageUrls },
      en: { ...baseEN, name: itemData.name, description: itemData.description, category: itemData.category, cost_price: itemData.costPrice, markup_percent: itemData.markupPercent, sell_price: itemData.sellPrice, stock_quantity: itemData.stockQuantity, discount_percent: itemData.discountPercent, image_urls: imageUrls },
    };
  }
  if (storeName === 'customers') {
    return {
      pt: { ...basePT, nome: itemData.name, telefone: itemData.phone, email: itemData.email, endereco: itemData.address, origem: itemData.source },
      en: { ...baseEN, name: itemData.name, phone: itemData.phone, email: itemData.email, address: itemData.address, source: itemData.source },
    };
  }
  if (storeName === 'orders') {
    return {
      pt: { ...basePT, nome_do_cliente: itemData.customerName, telefone_do_cliente: itemData.customerPhone, itens: itemData.items, valor_total: itemData.totalAmount, valor_do_desconto: itemData.discountAmount, metodo_de_pagamento: itemData.paymentMethod, observacoes: itemData.notes, status: itemData.status },
      en: { ...baseEN, customer_name: itemData.customerName, customer_phone: itemData.customerPhone, items: itemData.items, total_amount: itemData.totalAmount, discount_amount: itemData.discountAmount, payment_method: itemData.paymentMethod, notes: itemData.notes, status: itemData.status },
    };
  }
  if (storeName === 'settings') {
    return {
      pt: { ...basePT, margem_padrao: itemData.defaultMarkup, nome_da_loja: itemData.storeName, moeda: itemData.currency, numero_do_whatsapp: itemData.whatsappNumber, descricao_da_loja: itemData.storeDescription },
      en: { ...baseEN, default_markup: itemData.defaultMarkup, store_name: itemData.storeName, currency: itemData.currency, whatsapp_number: itemData.whatsappNumber, store_description: itemData.storeDescription },
    };
  }
  if (storeName === 'resellers') {
    return {
      pt: { nome_completo: itemData.nomeCompleto, whatsapp: itemData.whatsapp, senha: itemData.senha, endereco: itemData.endereco, status: itemData.status || 'pendente', total_vendido: itemData.totalVendido || 0, comissao_paga: itemData.comissaoPaga || 0, comissao_a_pagar: itemData.comissaoAPagar || 0, criado_em: new Date().toISOString() },
      en: { name: itemData.nomeCompleto, whatsapp: itemData.whatsapp, password: itemData.senha, address: itemData.endereco, status: itemData.status || 'pending', total_sold: itemData.totalVendido || 0, commission_paid: itemData.comissaoPaga || 0, commission_to_pay: itemData.comissaoAPagar || 0, created_at: new Date().toISOString() },
    };
  }
  if (storeName === 'resellerProducts') {
    return {
      pt: { revendedor_id: itemData.revendedorId, produto_id: itemData.produtoId, nome_produto: itemData.nomeProduto, imagem_url: itemData.imagemUrl || '', preco_venda: itemData.precoVenda, quantidade: itemData.quantidade, criado_em: new Date().toISOString() },
      en: { reseller_id: itemData.revendedorId, product_id: itemData.produtoId, product_name: itemData.nomeProduto, image_url: itemData.imagemUrl || '', sell_price: itemData.precoVenda, quantity: itemData.quantidade, created_at: new Date().toISOString() },
    };
  }
  if (storeName === 'resellerCustomers') {
    return {
      pt: { revendedor_id: itemData.revendedorId, nome: itemData.nome, whatsapp: itemData.whatsapp, endereco: itemData.endereco || '', criado_em: new Date().toISOString() },
      en: { reseller_id: itemData.revendedorId, name: itemData.nome, whatsapp: itemData.whatsapp, address: itemData.endereco || '', created_at: new Date().toISOString() },
    };
  }
  if (storeName === 'resellerSales') {
    return {
      pt: { revendedor_id: itemData.revendedorId, cliente_nome: itemData.clienteNome, cliente_whatsapp: itemData.clienteWhastapp || '', itens: itemData.itens, total_venda: itemData.totalVenda, comissao_percentual: itemData.comissaoPercentual, comissao_valor: itemData.comissaoValor, metodo_pagamento: itemData.metodoPagamento, parcelas: itemData.parcelas || 1, status: itemData.status || 'concluida', criado_em: new Date().toISOString() },
      en: { reseller_id: itemData.revendedorId, customer_name: itemData.clienteNome, customer_whatsapp: itemData.clienteWhastapp || '', items: itemData.itens, total_sale: itemData.totalVenda, commission_percent: itemData.comissaoPercentual, commission_value: itemData.comissaoValor, payment_method: itemData.metodoPagamento, installments: itemData.parcelas || 1, status: itemData.status || 'completed', created_at: new Date().toISOString() },
    };
  }
  return { pt: { ...basePT, ...itemData }, en: { ...baseEN, ...itemData } };
};

const tableCache: Record<string, { tableName: string; isPT: boolean }> = {};

export const useSupabaseDB = <T extends { id?: string }>(storeName: string) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const primaryTableName = TABLE_MAP[storeName] || storeName;
  const fallbackTableName = storeName;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let tableName = primaryTableName;
      let isPT = primaryTableName !== storeName;

      if (tableCache[storeName]) {
        tableName = tableCache[storeName].tableName;
        isPT = tableCache[storeName].isPT;
      }

      let { data: items, error } = await supabase.from(tableName).select('*');

      if (error) {
        console.warn(`Tabela '${tableName}' falhou (${error.message}). Tentando '${fallbackTableName}'...`);
        const fallback = await supabase.from(fallbackTableName).select('*');
        if (fallback.error) {
          console.error(`Ambas tabelas falharam para ${storeName}:`, fallback.error.message);
          throw fallback.error;
        }
        tableName = fallbackTableName;
        isPT = false;
        items = fallback.data;
        console.log(`Conexao OK com tabela '${tableName}' - ${items?.length || 0} registros`);
      } else {
        console.log(`Conexao OK com tabela '${tableName}' - ${items?.length || 0} registros`);
      }

      tableCache[storeName] = { tableName, isPT };

      const translatedItems = (items || []).map((item: any) => translateFromDB(storeName, item));
      setData(translatedItems);
    } catch (err: any) {
      console.error(`Erro ao buscar ${storeName}:`, err?.message || err);
    } finally {
      setLoading(false);
    }
  }, [primaryTableName, fallbackTableName, storeName]);

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

      const translated = translateToDB(storeName, { ...itemData, imageUrl });
      const cache = tableCache[storeName];
      const tableName = cache?.tableName || primaryTableName;
      const itemToSave = cache?.isPT ? translated.pt : translated.en;

      const { data, error } = await supabase.from(tableName).insert(itemToSave).select().single();
      if (error) throw error;
      fetchData();
      return data?.id || null;
    } catch (err) {
      console.error(`Erro ao criar em ${storeName}:`, err);
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

      const translated = translateToDB(storeName, { ...itemData, imageUrl: imageUrl || itemData.imageUrls });
      const cache = tableCache[storeName];
      const tableName = cache?.tableName || primaryTableName;
      const itemToUpdate = cache?.isPT ? translated.pt : translated.en;
      delete itemToUpdate.criado_em;
      delete itemToUpdate.created_at;

      const { error } = await supabase.from(tableName).update(itemToUpdate).eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error(`Erro ao atualizar em ${storeName}:`, err);
    }
  };

  const remove = async (id: string): Promise<void> => {
    try {
      const cache = tableCache[storeName];
      const tableName = cache?.tableName || primaryTableName;
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error(`Erro ao remover em ${storeName}:`, err);
    }
  };

  return { data, loading, create, update, remove, refresh: fetchData };
};

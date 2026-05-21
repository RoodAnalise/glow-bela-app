import { useState, useEffect, useCallback } from 'react';
import { supabase, uploadImage } from './supabase';

// Mapeamento: Nome que o site usa -> Nome da tabela no banco
const TABLE_MAP: Record<string, string> = {
  products: 'produtos',
  customers: 'clientes',
  orders: 'pedidos',
  settings: 'configuracoes',
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
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;

      // TRADUZIR de Português (Banco) para Inglês (Site)
      const translatedItems = (items || []).map((item: any) => {
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
        return item;
      });

      setData(translatedItems);
    } catch (err) {
      console.error(`Erro ao buscar ${tableName}:`, err);
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

      // TRADUZIR de Inglês (Site) para Português (Banco) antes de salvar
      const itemToSave: any = {
        criado_em: new Date().toISOString(),
        url_da_imagem: imageUrl,
      };

      if (storeName === 'products') {
        itemToSave.nome = itemData.name;
        itemToSave.descricao = itemData.description;
        itemToSave.categoria = itemData.category;
        itemToSave.preco_de_custo = itemData.costPrice;
        itemToSave.porcentagem_de_margem = itemData.markupPercent;
        itemToSave.preco_de_venda = itemData.sellPrice;
        itemToSave.quantidade_em_estoque = itemData.stockQuantity;
        itemToSave.porcentagem_de_desconto = itemData.discountPercent;
      } else if (storeName === 'customers') {
        itemToSave.nome = itemData.name;
        itemToSave.telefone = itemData.phone;
        itemToSave.email = itemData.email;
        itemToSave.endereco = itemData.address;
        itemToSave.origem = itemData.source;
      } else if (storeName === 'orders') {
        itemToSave.nome_do_cliente = itemData.customerName;
        itemToSave.telefone_do_cliente = itemData.customerPhone;
        itemToSave.itens = itemData.items;
        itemToSave.valor_total = itemData.totalAmount;
        itemToSave.valor_do_desconto = itemData.discountAmount;
        itemToSave.metodo_de_pagamento = itemData.paymentMethod;
        itemToSave.observacoes = itemData.notes;
        itemToSave.status = itemData.status;
      } else if (storeName === 'settings') {
        itemToSave.margem_padrao = itemData.defaultMarkup;
        itemToSave.nome_da_loja = itemData.storeName;
        itemToSave.moeda = itemData.currency;
        itemToSave.numero_do_whatsapp = itemData.whatsappNumber;
        itemToSave.descricao_da_loja = itemData.storeDescription;
      } else {
        Object.assign(itemToSave, itemData);
      }
      
      const { data, error } = await supabase
        .from(tableName)
        .insert(itemToSave)
        .select()
        .single();

      if (error) throw error;
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

      const itemToUpdate: any = {
        atualizado_em: new Date().toISOString(),
        url_da_imagem: imageUrl,
      };

      if (storeName === 'products') {
        itemToUpdate.nome = itemData.name;
        itemToUpdate.descricao = itemData.description;
        itemToUpdate.categoria = itemData.category;
        itemToUpdate.preco_de_custo = itemData.costPrice;
        itemToUpdate.porcentagem_de_margem = itemData.markupPercent;
        itemToUpdate.preco_de_venda = itemData.sellPrice;
        itemToUpdate.quantidade_em_estoque = itemData.stockQuantity;
        itemToUpdate.porcentagem_de_desconto = itemData.discountPercent;
      } else if (storeName === 'customers') {
        itemToUpdate.nome = itemData.name;
        itemToUpdate.telefone = itemData.phone;
        itemToUpdate.email = itemData.email;
        itemToUpdate.endereco = itemData.address;
        itemToUpdate.origem = itemData.source;
      } else if (storeName === 'orders') {
        itemToUpdate.nome_do_cliente = itemData.customerName;
        itemToUpdate.telefone_do_cliente = itemData.customerPhone;
        itemToUpdate.itens = itemData.items;
        itemToUpdate.valor_total = itemData.totalAmount;
        itemToUpdate.valor_do_desconto = itemData.discountAmount;
        itemToUpdate.metodo_de_pagamento = itemData.paymentMethod;
        itemToUpdate.observacoes = itemData.notes;
        itemToUpdate.status = itemData.status;
      } else if (storeName === 'settings') {
        itemToUpdate.margem_padrao = itemData.defaultMarkup;
        itemToUpdate.nome_da_loja = itemData.storeName;
        itemToUpdate.moeda = itemData.currency;
        itemToUpdate.numero_do_whatsapp = itemData.whatsappNumber;
        itemToUpdate.descricao_da_loja = itemData.storeDescription;
      } else {
        Object.assign(itemToUpdate, itemData);
      }

      const { error } = await supabase
        .from(tableName)
        .update(itemToUpdate)
        .eq('id', id);

      if (error) throw error;
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

import { useState, useEffect, useCallback } from 'react';
import { supabase, uploadImage } from './supabase';

// Mapeamento de tabelas: o site usa nomes em inglês, o banco também.
// Se o seu banco foi criado com nomes em português, altere os valores aqui.
// Exemplo: products: 'produtos'
const TABLE_MAP: Record<string, string> = {
  products: 'products',
  customers: 'customers',
  orders: 'orders',
  settings: 'settings',
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
        .order('name', { ascending: true });

      if (error) throw error;

      // TRADUZIR de snake_case (Banco) para camelCase (Site)
      const translatedItems = (items || []).map((item: any) => {
        if (storeName === 'products') {
          return {
            id: item.id,
            name: item.name,
            description: item.description,
            category: item.category,
            costPrice: item.cost_price,
            markupPercent: item.markup_percent,
            sellPrice: item.sell_price,
            stockQuantity: item.stock_quantity,
            discountPercent: item.discount_percent,
            imageUrl: item.image_url,
            createdAt: item.created_at,
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

      // TRADUZIR de camelCase (Site) para snake_case (Banco)
      const itemToSave: any = {
        created_at: new Date().toISOString(),
        image_url: imageUrl,
      };

      if (storeName === 'products') {
        itemToSave.name = itemData.name;
        itemToSave.description = itemData.description;
        itemToSave.category = itemData.category;
        itemToSave.cost_price = itemData.costPrice;
        itemToSave.markup_percent = itemData.markupPercent;
        itemToSave.sell_price = itemData.sellPrice;
        itemToSave.stock_quantity = itemData.stockQuantity;
        itemToSave.discount_percent = itemData.discountPercent;
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
        updated_at: new Date().toISOString(),
        image_url: imageUrl,
      };

      if (storeName === 'products') {
        itemToUpdate.name = itemData.name;
        itemToUpdate.description = itemData.description;
        itemToUpdate.category = itemData.category;
        itemToUpdate.cost_price = itemData.costPrice;
        itemToUpdate.markup_percent = itemData.markupPercent;
        itemToUpdate.sell_price = itemData.sellPrice;
        itemToUpdate.stock_quantity = itemData.stockQuantity;
        itemToUpdate.discount_percent = itemData.discountPercent;
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

import { useState, useEffect, useCallback } from 'react';
import { supabase, uploadImage } from './supabase';

type StoreName = 'products' | 'customers' | 'sales' | 'settings' | 'orders';

interface DBItem {
  id?: string;
  [key: string]: any;
}

export const useSupabaseDB = <T extends DBItem>(storeName: StoreName) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: items, error } = await supabase
        .from(storeName)
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setData(items || []);
    } catch (err) {
      console.error(`Error fetching ${storeName}:`, err);
    } finally {
      setLoading(false);
    }
  }, [storeName]);

  useEffect(() => {
    fetchData();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`${storeName}_changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: storeName },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const create = async (itemData: Omit<T, 'id'>, imageFile?: File): Promise<string | null> => {
    try {
      let imageUrl = '';
      if (imageFile) {
        const fileName = `${Date.now()}-${imageFile.name}`;
        imageUrl = await uploadImage(imageFile, fileName) || '';
      }

      const itemToSave = { ...itemData, image_url: imageUrl, created_at: new Date().toISOString() };
      
      const { data, error } = await supabase
        .from(storeName)
        .insert(itemToSave)
        .select()
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (err) {
      console.error(`Error creating ${storeName}:`, err);
      return null;
    }
  };

  const update = async (id: string, itemData: Partial<T>, imageFile?: File): Promise<void> => {
    try {
      let imageUrl = itemData.image_url || '';
      if (imageFile) {
        const fileName = `${Date.now()}-${imageFile.name}`;
        imageUrl = await uploadImage(imageFile, fileName) || '';
      }

      const itemToUpdate = { ...itemData, image_url: imageUrl, updated_at: new Date().toISOString() };
      
      const { error } = await supabase
        .from(storeName)
        .update(itemToUpdate)
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error(`Error updating ${storeName}:`, err);
    }
  };

  const remove = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from(storeName)
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error(`Error removing ${storeName}:`, err);
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

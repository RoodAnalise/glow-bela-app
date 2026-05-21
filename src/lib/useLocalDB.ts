import { useState, useEffect, useCallback } from 'react';
import { getAll, add, update, remove } from './localDB';

type StoreName = 'products' | 'customers' | 'sales' | 'settings' | 'orders';

const listeners: Record<string, Set<() => void>> = {};

function notify(storeName: string) {
  if (listeners[storeName]) {
    listeners[storeName].forEach(fn => fn());
  }
}

export const useLocalDB = <T extends { id?: string }>(storeName: StoreName) => {
  const [data, setData] = useState<T[]>([]);

  const fetchData = useCallback(async () => {
    const items = await getAll<T>(storeName);
    setData(items);
    notify(storeName);
  }, [storeName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const subscribe = useCallback((callback: (data: T[]) => void) => {
    callback(data);

    const handler = async () => {
      const items = await getAll<T>(storeName);
      callback(items);
    };

    if (!listeners[storeName]) {
      listeners[storeName] = new Set();
    }
    listeners[storeName].add(handler);

    return () => {
      listeners[storeName].delete(handler);
    };
  }, [storeName, data]);

  const create = async (itemData: Omit<T, 'id'>) => {
    const id = await add(storeName, itemData as any);
    notify(storeName);
    return id;
  };

  const updateItem = async (id: string, itemData: Partial<T>) => {
    await update(storeName, id, itemData);
    notify(storeName);
  };

  const removeItem = async (id: string) => {
    await remove(storeName, id);
    notify(storeName);
  };

  return {
    list: fetchData,
    create,
    update: updateItem,
    remove: removeItem,
    subscribe,
    data,
  };
};

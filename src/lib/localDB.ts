const DB_NAME = 'glow-bela-db';
const DB_VERSION = 2;

const STORES = ['products', 'customers', 'sales', 'settings', 'orders'] as const;
type StoreName = typeof STORES[number];

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id' });
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAll<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

async function add<T extends { id?: string }>(storeName: StoreName, data: T): Promise<string> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const id = crypto.randomUUID();
    const entry = { ...data, id, createdAt: Date.now() };
    const request = store.add(entry);
    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

async function update<T>(storeName: StoreName, id: string, data: Partial<T>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const existing = getRequest.result;
      if (existing) {
        const updated = { ...existing, ...data, updatedAt: Date.now() };
        store.put(updated);
      }
      resolve();
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

async function remove(storeName: StoreName, id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export { getAll, add, update, remove };

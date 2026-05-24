// lib/iconic-cache.js
// IndexedDB cache for bootstrap payload. TTL: 10 minutes.
// Falls back gracefully if IndexedDB is unavailable (SSR, private mode).

const DB_NAME    = 'iconic-tracker-v2';
const DB_VERSION = 1;
const STORE      = 'snapshots';
const TTL_MS     = 10 * 60 * 1000; // 10 minutes

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'key' });
      }
    };

    req.onsuccess  = (e) => resolve(e.target.result);
    req.onerror    = (e) => reject(e.target.error);
  });
}

export async function cacheGet(key) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx    = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const req   = store.get(key);

      req.onsuccess = (e) => {
        const record = e.target.result;
        if (!record) { resolve(null); return; }
        if (Date.now() - record.timestamp > TTL_MS) { resolve(null); return; }
        resolve(record.data);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function cacheSet(key, data) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx    = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      store.put({ key, data, timestamp: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror    = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export async function cacheClear(key) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx    = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      store.delete(key || 'bootstrap');
      tx.oncomplete = () => resolve(true);
      tx.onerror    = () => resolve(false);
    });
  } catch {
    return false;
  }
}

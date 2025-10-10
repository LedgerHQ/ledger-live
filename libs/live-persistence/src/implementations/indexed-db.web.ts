/**
 * IndexedDB implementation for web platforms
 *
 * This implementation provides persistent caching using IndexedDB for web browsers.
 * It's designed to be pluggable and takes the required interfaces as parameters.
 */

import { CacheEntry, CacheAdapter, CacheConfig } from "../types";

export function createIndexedDBCacheAdapter<T = unknown>(
  config: CacheConfig,
  dbName = "crypto-assets-cache",
  storeName = "tokens",
): CacheAdapter<T> {
  let db: IDBDatabase | null = null;

  async function getDB(): Promise<IDBDatabase> {
    if (db) return db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        db = request.result;
        resolve(db);
      };

      request.onupgradeneeded = event => {
        const database = (event.target as IDBOpenDBRequest).result;
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName);
        }
      };
    });
  }

  function validateCacheEntry<T>(entry: unknown): entry is CacheEntry<T> {
    if (!entry || typeof entry !== "object") return false;

    const cacheEntry = entry as Record<string, unknown>;
    return (
      typeof cacheEntry.timestamp === "number" &&
      typeof cacheEntry.expiresAt === "number" &&
      typeof cacheEntry.refreshAt === "number" &&
      typeof cacheEntry.ttl === "number" &&
      typeof cacheEntry.version === "number" &&
      "data" in cacheEntry
    );
  }

  // Internal helper function to delete expired keys
  const deleteExpiredKeys = async (keys: string[]): Promise<void> => {
    if (keys.length === 0) return;

    const database = await getDB();
    const transaction = database.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);

    // Delete all expired keys
    const deletePromises = keys.map(
      key =>
        new Promise<void>((resolve, reject) => {
          const request = store.delete(key);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        }),
    );

    await Promise.all(deletePromises);
  };

  return {
    ttl: config.ttl,
    refreshTtl: config.refreshTtl,
    version: config.version,

    async get<T>(key: string): Promise<CacheEntry<T> | null> {
      try {
        const database = await getDB();
        const entry = await new Promise<CacheEntry<T> | null>((resolve, reject) => {
          const transaction = database.transaction([storeName], "readonly");
          const store = transaction.objectStore(storeName);
          const request = store.get(key);

          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const result = request.result;
            if (!result) {
              resolve(null);
              return;
            }

            // Validate the entry structure
            if (validateCacheEntry<T>(result)) {
              resolve(result);
            } else {
              resolve(null);
            }
          };
        });

        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
          await this.delete(key);
          return null;
        }

        return entry;
      } catch {
        return null;
      }
    },

    async set<T>(key: string, value: T): Promise<void> {
      // If TTL is 0 or negative, don't store the entry
      if (this.ttl <= 0) {
        return;
      }

      const ttlMs = this.ttl * 1000;
      const refreshMs = this.refreshTtl * 1000;
      const now = Date.now();

      const entry: CacheEntry<T> = {
        data: value,
        timestamp: now,
        expiresAt: now + ttlMs,
        refreshAt: now + refreshMs,
        ttl: ttlMs,
        version: this.version,
      };

      const database = await getDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.put(entry, key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    },

    async delete(key: string): Promise<void> {
      const database = await getDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    },

    async clear(): Promise<void> {
      const database = await getDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    },

    async cleanupExpired(): Promise<number> {
      const database = await getDB();
      const expiredKeys: string[] = [];
      const now = Date.now();

      // Scan all keys and find expired ones
      const transaction = database.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.openCursor();

      return new Promise((resolve, reject) => {
        request.onsuccess = event => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const key = cursor.key as string;
            const entry = cursor.value;

            // Validate entry structure and check expiration
            if (validateCacheEntry(entry) && now > entry.expiresAt) {
              expiredKeys.push(key);
            } else if (!validateCacheEntry(entry)) {
              // If entry is invalid, consider it expired
              expiredKeys.push(key);
            }
            cursor.continue();
          } else {
            // All keys scanned, now delete expired ones
            deleteExpiredKeys(expiredKeys)
              .then(() => {
                resolve(expiredKeys.length);
              })
              .catch(reject);
          }
        };
        request.onerror = () => reject(request.error);
      });
    },
  };
}

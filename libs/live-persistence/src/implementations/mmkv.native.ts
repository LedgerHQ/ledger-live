/**
 * MMKV implementation for React Native platforms
 *
 * This implementation provides persistent caching using MMKV for React Native.
 * It's designed to be pluggable and takes the required interfaces as parameters.
 */

import { CacheEntry, CacheAdapter, CacheConfig } from "../types";

export function createMMKVCacheAdapter<T = unknown>(
  mmkvInstance: {
    getString(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    clearAll(): void;
    getAllKeys(): string[];
  },
  config: CacheConfig,
  keyPrefix = "crypto-assets-cache:",
): CacheAdapter<T> {
  const CACHE_PREFIX = keyPrefix;

  function deserializeValue<T>(serialized: string): CacheEntry<T> | null {
    try {
      const parsed = JSON.parse(serialized);

      // Validate required fields
      if (
        typeof parsed.timestamp !== "number" ||
        typeof parsed.expiresAt !== "number" ||
        typeof parsed.refreshAt !== "number" ||
        typeof parsed.ttl !== "number" ||
        typeof parsed.version !== "number"
      ) {
        return null;
      }

      return {
        data: parsed.data,
        timestamp: parsed.timestamp,
        expiresAt: parsed.expiresAt,
        refreshAt: parsed.refreshAt,
        ttl: parsed.ttl,
        version: parsed.version,
      };
    } catch {
      return null;
    }
  }

  return {
    ttl: config.ttl,
    refreshTtl: config.refreshTtl,
    version: config.version,

    async get<T>(key: string): Promise<CacheEntry<T> | null> {
      try {
        const serialized = mmkvInstance.getString(CACHE_PREFIX + key);
        if (!serialized) return null;

        const entry = deserializeValue<T>(serialized);
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
      const serialized = JSON.stringify(entry);
      mmkvInstance.set(CACHE_PREFIX + key, serialized);
    },

    async delete(key: string): Promise<void> {
      mmkvInstance.delete(CACHE_PREFIX + key);
    },

    async clear(): Promise<void> {
      mmkvInstance.clearAll();
    },

    async cleanupExpired(): Promise<number> {
      try {
        const allKeys = mmkvInstance.getAllKeys();
        const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_PREFIX));
        const now = Date.now();
        let cleanedCount = 0;

        for (const fullKey of cacheKeys) {
          const serialized = mmkvInstance.getString(fullKey);

          if (serialized) {
            const entry = deserializeValue<T>(serialized);
            if (!entry || now > entry.expiresAt) {
              mmkvInstance.delete(fullKey);
              cleanedCount++;
            }
          }
        }

        return cleanedCount;
      } catch {
        return 0;
      }
    },
  };
}

/**
 * In-memory cache implementation
 *
 * This implementation provides a simple in-memory cache that can be used
 * as a fallback or for testing purposes.
 */

import { CacheEntry, CacheAdapter, CacheConfig } from "../types";

export function createMemoryCacheAdapter<T = unknown>(
  config: CacheConfig,
): CacheAdapter<T> & {
  _storage: Map<string, CacheEntry<T>>;
} {
  const cache = new Map<string, CacheEntry<T>>();

  return {
    ttl: config.ttl,
    refreshTtl: config.refreshTtl,
    version: config.version,
    _storage: cache, // Expose storage for testing

    async get(key: string): Promise<CacheEntry<T> | null> {
      const entry = cache.get(key);
      if (!entry) return null;

      if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
      }

      return entry;
    },

    async set(key: string, value: T): Promise<void> {
      const ttlMs = this.ttl * 1000; // Convert seconds to milliseconds
      const refreshMs = this.refreshTtl * 1000; // Convert seconds to milliseconds
      const now = Date.now();

      const entry: CacheEntry<T> = {
        data: value,
        timestamp: now,
        expiresAt: now + ttlMs,
        refreshAt: now + refreshMs,
        ttl: ttlMs,
        version: this.version,
      };

      // If TTL is 0 or negative, don't store the entry
      if (this.ttl <= 0) {
        return;
      }

      cache.set(key, entry);
    },

    async delete(key: string): Promise<void> {
      cache.delete(key);
    },

    async clear(): Promise<void> {
      cache.clear();
    },

    async cleanupExpired(): Promise<number> {
      const now = Date.now();
      const expiredKeys: string[] = [];

      // Find all expired keys
      for (const [key, entry] of cache.entries()) {
        if (now > entry.expiresAt) {
          expiredKeys.push(key);
        }
      }

      // Delete expired keys
      expiredKeys.forEach(key => cache.delete(key));

      return expiredKeys.length;
    },
  };
}

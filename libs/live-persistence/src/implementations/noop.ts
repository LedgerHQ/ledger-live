import { CacheAdapter, CacheEntry, CacheConfig } from "../types";

export function createNoopCacheAdapter<T = unknown>(config: CacheConfig): CacheAdapter<T> {
  return {
    ttl: config.ttl,
    refreshTtl: config.refreshTtl,
    version: config.version,

    async get<T>(_key: string): Promise<CacheEntry<T> | null> {
      return null;
    },
    async set<T>(_key: string, _value: T): Promise<void> {
      // No-op
    },
    async delete(_key: string): Promise<void> {
      // No-op
    },
    async clear(): Promise<void> {
      // No-op
    },
    async cleanupExpired(): Promise<number> {
      // No-op
      return 0;
    },
  };
}

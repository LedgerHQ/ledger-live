/**
 * Common types for cache implementations
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  refreshAt: number;
  ttl: number;
  version: number;
}

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  refreshTtl: number; // Refresh time in seconds
  version: number; // Cache version for schema changes
}

export interface CacheAdapter<T = unknown> {
  readonly ttl: number; // Time to live in seconds
  readonly refreshTtl: number; // Refresh time in seconds
  readonly version: number; // Cache version for schema changes

  get(key: string): Promise<CacheEntry<T> | null>;
  set(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  cleanupExpired(): Promise<number>;
}

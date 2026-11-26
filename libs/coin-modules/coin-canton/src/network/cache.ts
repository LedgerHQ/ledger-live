import { makeLRUCache, type CacheRes } from "@ledgerhq/live-network/cache";
import type { CantonCoinConfig } from "../config";

const MAX_ENTRIES = 100;
/** Enough for every served currency's TTL at once; the least recently used one is dropped. */
const MAX_TTLS = 4;

export type ConfigurableCache<A extends [CantonCoinConfig, ...unknown[]], T> = {
  (...args: A): Promise<T>;
  /** Drops the key from every TTL's cache. */
  clear: (key: string) => void;
  reset: () => void;
};

/**
 * One LRU cache per TTL the coin config resolves to, so a currency with an overridden TTL does not
 * evict the entries of another.
 */
export function makeConfigurableLRUCache<A extends [CantonCoinConfig, ...unknown[]], T>(
  f: (...args: A) => Promise<T>,
  keyOf: (...args: A) => string,
  ttlMsOf: (config: CantonCoinConfig) => number,
): ConfigurableCache<A, T> {
  const caches = new Map<number, CacheRes<A, T>>();
  const cacheFor = (ttl: number): CacheRes<A, T> => {
    const cache = caches.get(ttl) ?? makeLRUCache(f, keyOf, { max: MAX_ENTRIES, ttl });
    // Re-inserted on every use, so the Map's first key is the least recently used TTL.
    caches.delete(ttl);
    caches.set(ttl, cache);
    const [leastRecent] = caches.keys();
    if (caches.size > MAX_TTLS) caches.delete(leastRecent);
    return cache;
  };
  const cached = (...args: A): Promise<T> => cacheFor(ttlMsOf(args[0]))(...args);
  cached.clear = (key: string): void => caches.forEach(cache => cache.clear(key));
  cached.reset = (): void => caches.clear();
  return cached;
}

import { makeLRUCache, type CacheRes } from "@ledgerhq/live-network/cache";
import { pinConfig, type CantonCoinConfig, type CantonContext } from "../config";

const MAX_ENTRIES = 100;
/** Enough for every served currency's TTL at once; the least recently used one is dropped. */
const MAX_TTLS = 4;

export type ConfigurableCache<A extends unknown[], T> = {
  (context: CantonContext, ...args: A): Promise<T>;
  /** Drops the key from every TTL's cache. */
  clear: (key: string) => void;
  reset: () => void;
};

type Resolved<A extends unknown[]> = [config: CantonCoinConfig, context: CantonContext, ...A];

/**
 * One LRU cache per TTL the coin config resolves to, so a currency with an overridden TTL does not
 * evict the entries of another. The config is resolved once per call: it selects the cache and
 * enters the key, and the fetch receives a context pinned to it.
 */
export function makeConfigurableLRUCache<A extends unknown[], T>(
  f: (context: CantonContext, ...args: A) => Promise<T>,
  keyOf: (config: CantonCoinConfig, ...args: A) => string,
  ttlMsOf: (config: CantonCoinConfig) => number,
): ConfigurableCache<A, T> {
  const caches = new Map<number, CacheRes<Resolved<A>, T>>();
  const fetch = (_config: CantonCoinConfig, context: CantonContext, ...args: A) =>
    f(context, ...args);
  const keyOfResolved = (config: CantonCoinConfig, _context: CantonContext, ...args: A) =>
    keyOf(config, ...args);
  const cacheFor = (ttl: number): CacheRes<Resolved<A>, T> => {
    const cache = caches.get(ttl) ?? makeLRUCache(fetch, keyOfResolved, { max: MAX_ENTRIES, ttl });
    // Re-inserted on every use, so the Map's first key is the least recently used TTL.
    caches.delete(ttl);
    caches.set(ttl, cache);
    const [leastRecent] = caches.keys();
    if (caches.size > MAX_TTLS) caches.delete(leastRecent);
    return cache;
  };
  const cached = async (context: CantonContext, ...args: A): Promise<T> => {
    const config = await context.config();
    const cache = cacheFor(ttlMsOf(config));
    // A key left in another TTL's cache would serve a stale value if the TTL switches back.
    const key = keyOf(config, ...args);
    caches.forEach(other => other !== cache && other.clear(key));
    return cache(config, pinConfig(context, config), ...args);
  };
  cached.clear = (key: string): void => caches.forEach(cache => cache.clear(key));
  cached.reset = (): void => caches.clear();
  return cached;
}

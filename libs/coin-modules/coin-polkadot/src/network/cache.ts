import { makeLRUCache, type CacheRes } from "@ledgerhq/live-network/cache";

const MAX_ENTRIES = 100;

export const makeConfigurableLRUCache = <F extends (...args: any[]) => Promise<any>>(
  f: F,
  keyExtractor: (...args: Parameters<F>) => string,
  ttlMsOf: (...args: Parameters<F>) => number,
  max = MAX_ENTRIES,
) => {
  type Result = Awaited<ReturnType<F>>;
  type Active = { ttlMs: number; cache: CacheRes<Parameters<F>, Result> };
  const hydrated = new Map<string, Result>();
  let active: Active | undefined;

  const cacheFor = (ttlMs: number): CacheRes<Parameters<F>, Result> => {
    if (active?.ttlMs === ttlMs) {
      return active.cache;
    }
    const cache = makeLRUCache<Parameters<F>, Result>(f, keyExtractor, { max, ttl: ttlMs });
    hydrated.forEach((value, key) => cache.hydrate(key, value));
    active = { ttlMs, cache };
    return cache;
  };

  const cached = (...args: Parameters<F>): Promise<Result> => {
    return cacheFor(ttlMsOf(...args))(...args);
  };
  cached.force = (...args: Parameters<F>): Promise<Result> => {
    return cacheFor(ttlMsOf(...args)).force(...args);
  };
  cached.hydrate = (key: string, value: Result): void => {
    hydrated.set(key, value);
    active?.cache.hydrate(key, value);
  };

  return cached;
};

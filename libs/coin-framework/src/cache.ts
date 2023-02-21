import LRU from "lru-cache";

// Copy from live-common/cache.ts
// Need to be moved in a lower package.
export type CacheRes<A extends Array<any>, T> = {
  (...args: A): Promise<T>;
  force: (...args: A) => Promise<T>;
  hydrate: (key: string, value: T) => void;
  clear: (key: string) => void;
  reset: () => void;
};

// Extracted from `makeLRUCache` function defined in live-common/cache.ts
// Need to be moved in a lower package.
export type LRUCacheFn = <A extends Array<any>, T>(
  f: (...args: A) => Promise<T>,
  keyExtractor?: (...args: A) => string,
  lruOpts?: LRU.Options<string, any>
) => CacheRes<A, T>;

export const makeNoCache: LRUCacheFn = <A extends Array<any>, T>(
  f: (...args: A) => Promise<T>
): CacheRes<A, T> => {
  const result = (...args: A) => {
    return f(...args).catch((e) => {
      throw e;
    });
  };

  result.force = (...args: A) => {
    return f(...args).catch((e) => {
      throw e;
    });
  };

  result.hydrate = () => {};
  result.clear = () => {};
  result.reset = () => {};

  return result;
};

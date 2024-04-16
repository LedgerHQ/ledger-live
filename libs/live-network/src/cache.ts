import LRU from "lru-cache";

export type CacheOptions = LRU.Options<string, unknown>; //{ max: number; ttl: number };
export function seconds(num: number, max = 100): CacheOptions {
  return {
    max,
    ttl: num * 1000,
  };
}
export function minutes(num: number, max = 100): CacheOptions {
  return seconds(num * 60, max);
}
export function hours(num: number, max = 100): CacheOptions {
  return minutes(num * 60, max);
}

export type CacheRes<A extends Array<any>, T> = {
  (...args: A): Promise<T>;
  force: (...args: A) => Promise<T>;
  hydrate: (key: string, value: T) => void;
  clear: (key: string) => void;
  reset: () => void;
};

/**
 * Creates an LRU cache function that wraps the given async function `f`.
 * By default it will have a lifespan of 300 seconds and a change in the key
 * will invalidate its value.
 *
 * @param {(...args: A) => Promise<T>} f - The async function to be cached.
 * @param {(...args: A) => string} [keyExtractor] - A function that extracts a cache key from the arguments passed to `f`.
 * @param {LRU.Options<string, any>} [lruOpts] - Options for the internal LRU cache.
 *
 * @returns {CacheRes<A, T>} A cached version of the async function `f`.
 */
export const makeLRUCache = <A extends Array<any>, T>(
  f: (...args: A) => Promise<T>,
  keyExtractor: (...args: A) => string = () => "",
  lruOpts: LRU.Options<string, any> = {
    max: 100,
    ttl: 5 * 60 * 1000,
  },
): CacheRes<A, T> => {
  // LRU-Cache is written in JS and do not enforce in its code the type checking.
  // Regarding its [documentation](https://github.com/isaacs/node-lru-cache/#ttl), `max` or `ttlAutopurge` must be set.
  // As the code in live use sometimes `max` property with `ttl`, we check it's defined in `lruOpts` to add or not `ttlAutopurge`.
  // eslint-disable-next-line
  // @ts-ignore: TS-2339
  lruOpts = lruOpts.max
    ? lruOpts
    : {
        ...lruOpts,
        ttlAutopurge: true,
      };
  const cache = new LRU(lruOpts);

  const result = (...args: A) => {
    const key = keyExtractor(...args);
    let promise = cache.get(key);
    if (promise) return promise;
    promise = f(...args).catch(e => {
      cache.delete(key);
      throw e;
    });
    cache.set(key, promise);
    return promise;
  };

  result.force = (...args: A) => {
    const key = keyExtractor(...args);
    const promise = f(...args).catch(e => {
      cache.delete(key);
      throw e;
    });
    cache.set(key, promise);
    return promise;
  };

  result.hydrate = (key: string, value: T) => {
    cache.set(key, Promise.resolve(value));
  };

  result.clear = (key: string) => {
    cache.delete(key);
  };

  result.reset = () => {
    cache.clear();
  };

  return result;
};

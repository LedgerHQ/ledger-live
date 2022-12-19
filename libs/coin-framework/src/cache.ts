import LRU from "lru-cache";
export type CacheRes<A extends Array<any>, T> = {
  (...args: A): Promise<T>;
  force: (...args: A) => Promise<T>;
  hydrate: (arg0: string, arg1: T) => void;
  clear: (arg0: string) => void;
  reset: () => void;
};
export const makeLRUCache = <A extends Array<any>, T>(
  f: (...args: A) => Promise<T>,
  keyExtractor: (...args: A) => string = () => "",
  lruOpts: Record<string, any> = {
    max: 100,
    maxAge: 5 * 60 * 1000,
  }
): CacheRes<A, T> => {
  const cache = new LRU(lruOpts);

  const result = (...args: A) => {
    const key = keyExtractor(...args);
    let promise = cache.get(key);
    if (promise) return promise;
    promise = f(...args).catch((e) => {
      cache.del(key);
      throw e;
    });
    cache.set(key, promise);
    return promise;
  };

  result.force = (...args: A) => {
    const key = keyExtractor(...args);
    const promise = f(...args).catch((e) => {
      cache.del(key);
      throw e;
    });
    cache.set(key, promise);
    return promise;
  };

  result.hydrate = (key: string, value: T) => {
    cache.set(key, Promise.resolve(value));
  };

  result.clear = (key: string) => {
    cache.del(key);
  };

  result.reset = () => {
    cache.reset();
  };

  return result;
};

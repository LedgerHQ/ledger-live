// @flow

import LRU from "lru-cache";

type Res<A, T> = {
  (...args: A): Promise<T>,
  force: (...args: A) => Promise<T>,
  hydrate: (string, T) => void
};

export const makeLRUCache = <A: Array<*>, T>(
  f: (...args: A) => Promise<T>,
  keyExtractor: (...args: A) => string = () => "",
  lruOpts: Object = {
    max: 100,
    maxAge: 5 * 60 * 1000
  }
): Res<A, T> => {
  const cache = new LRU(lruOpts);
  const result = (...args) => {
    const key = keyExtractor(...args);
    let promise = cache.get(key);
    if (promise) return promise;
    promise = f(...args).catch(e => {
      cache.del(key);
      throw e;
    });
    cache.set(key, promise);
    return promise;
  };
  result.force = (...args) => {
    const key = keyExtractor(...args);
    let promise = f(...args).catch(e => {
      cache.del(key);
      throw e;
    });
    cache.set(key, promise);
    return promise;
  };
  result.hydrate = (key: string, value: T) => {
    cache.set(key, Promise.resolve(value));
  };
  return result;
};

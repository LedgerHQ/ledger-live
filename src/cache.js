// @flow

import LRU from "lru-cache"; // eslint-disable-line

export const makeLRUCache = <A: Array<*>, T>(
  f: (...args: A) => Promise<T>,
  keyExtractor: (...args: A) => string,
  lruOpts: Object = {
    max: 100,
    maxAge: 5 * 60 * 1000
  }
): ((...args: A) => Promise<T>) => {
  const cache = LRU(lruOpts);
  return (...args) => {
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
};

import merge from "lodash/merge";

const cache: Record<string, unknown> = {};
const deviceStorage = {
  /**
   * Get a one or more value for a key or array of keys from AsyncStorage
   * @param {String|Array} key A key or array of keys
   * @return {Promise}
   */
  get(key: string | string[]): Promise<unknown> {
    if (!Array.isArray(key)) {
      const value = cache[key];
      return Promise.resolve(value);
    }

    return Promise.resolve(key.map(k => cache[k]));
  },

  /**
   * Save a key value pair or a series of key value pairs to AsyncStorage.
   * @param  {String|Array} key The key or an array of key/value pairs
   * @param  {Any} value The value to save
   * @return {Promise}
   */
  save<T>(key: string | Array<string>, value: T): Promise<void> {
    if (!Array.isArray(key)) {
      cache[key] = value;
    } else {
      key.forEach(([key, value]) => {
        cache[key] = value;
      });
    }

    return Promise.resolve();
  },

  /**
   * Updates the value in the store for a given key in AsyncStorage. If the value is a string it will be replaced. If the value is an object it will be deep merged.
   * @param  {String} key The key
   * @param  {Value} value The value to update with
   * @return {Promise}
   */
  update<T>(key: string, v: T): Promise<void> {
    const item = cache[key];
    const value = typeof v === "string" ? v : merge({}, item, v);
    cache[key] = value;
    return Promise.resolve();
  },

  /**
   * Delete the value for a given key in AsyncStorage.
   * @param  {String|Array} key The key or an array of keys to be deleted
   * @return {Promise}
   */
  delete(key: string | Array<string>): Promise<void> {
    if (Array.isArray(key)) {
      key.forEach(k => {
        delete cache[k];
      });
    } else {
      delete cache[key];
    }

    return Promise.resolve();
  },

  /**
   * Get all keys in AsyncStorage.
   * @return {Promise} A promise which when it resolves gets passed the saved keys in AsyncStorage.
   */
  keys(): Promise<string[]> {
    return Promise.resolve(Object.keys(cache));
  },

  /**
   * Push a value onto an array stored in AsyncStorage by key or create a new array in AsyncStorage for a key if it's not yet defined.
   * @param {String} key They key
   * @param {Any} value The value to push onto the array
   * @return {Promise}
   */
  push<T>(key: string, value: T): Promise<void> {
    const currentValue = cache[key];

    if (!currentValue) {
      // if there is no current value populate it with the new value
      return deviceStorage.save(key, [value]);
    }

    if (Array.isArray(currentValue)) {
      return deviceStorage.save(key, [...currentValue, value]);
    }

    return Promise.reject(
      new Error(
        `Existing value for key "${key}" must be of type null or Array, received ${typeof currentValue}.`,
      ),
    );
  },
};
module.exports = deviceStorage;

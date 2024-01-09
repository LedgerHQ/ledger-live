import { MMKVLoader } from "react-native-mmkv-storage";
import { merge } from "lodash";
import { StoreWrapper } from "./types";

const MMKV = new MMKVLoader().initialize();

// FIXME a temporary solution to implement the exact same interface.
// but in future, we should directly use MMKV (because it's better typed)

const deviceStorage: StoreWrapper = {
  /**
   * Get a one or more value for a key or array of keys from AsyncStorage
   * @param {String|Array} key A key or array of keys
   * @return {Promise}
   */
  async get<T extends object>(
    key: string | string[],
  ): Promise<T | (T | undefined | null)[] | null | undefined> {
    if (Array.isArray(key)) {
      const data = await MMKV.getMultipleItemsAsync<T>(key, "map");
      return data.map(item => item[1]);
    }
    const value = await MMKV.getMapAsync<T>(key);
    return value;
  },

  /**
   * Save a key value pair or a series of key value pairs to AsyncStorage.
   * @param  {String|Array} key The key or an array of key/value pairs
   * @param  {Any} value The value to save
   * @return {Promise}
   */
  async save<T extends object>(key: string | [string, T][], value?: T) {
    let pairs: [string, object][] = [];

    if (!Array.isArray(key)) {
      pairs.push([key, value || {}]);
    } else {
      pairs = key.map(pair => [pair[0], pair[1]]);
    }

    await Promise.all(pairs.map(pair => MMKV.setMapAsync(pair[0], pair[1])));
  },

  /**
   * Updates the value in the store for a given key in AsyncStorage. If the value is a string it will be replaced. If the value is an object it will be deep merged.
   * @param  {String} key The key
   * @param  {Value} value The value to update with
   * @return {Promise}
   */
  async update<T extends object>(key: string, value: T) {
    const currentValue = await MMKV.getMapAsync(key);
    await MMKV.setMapAsync(key, merge({}, currentValue, value));
  },

  /**
   * Delete the value for a given key in AsyncStorage.
   * @param  {String|Array} key The key or an array of keys to be deleted
   * @return {Promise}
   */
  async delete(key: string | string[]) {
    if (Array.isArray(key)) {
      await Promise.all(key.map(k => MMKV.removeItem(k)));
    } else {
      MMKV.removeItem(key);
    }
  },

  /**
   * Get all keys in AsyncStorage.
   * @return {Promise} A promise which when it resolves gets passed the saved keys in AsyncStorage.
   */
  keys(): Promise<string[]> {
    return MMKV.indexer.getKeys();
  },
};

export default deviceStorage;

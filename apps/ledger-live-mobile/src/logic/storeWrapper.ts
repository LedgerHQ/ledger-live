/**
 * @overview A minimalistic wrapper around React Native's AsyncStorage.
 * @license MIT
 */
// It's based on https://github.com/jasonmerino/react-native-simple-store
// with the new React-native-async-store package
import AsyncStorage from "@react-native-async-storage/async-storage";
import { merge } from "lodash";

const CHUNKED_KEY = "_-_CHUNKED";
const CHUNK_SIZE = 1000000;

const getChunks = (str, size) => {
  const strLength = str.length;
  const numChunks = Math.ceil(strLength / size);
  const chunks = new Array(numChunks);
  let i = 0;
  let o = 0;

  for (; i < numChunks; ++i, o += size) {
    chunks[i] = str.substr(o, size);
  }

  return chunks;
};

const stringifyPairs = pairs =>
  pairs.reduce((acc, current) => {
    const key = current[0];
    const data = JSON.stringify(current[1]);

    if (data.length > CHUNK_SIZE) {
      const chunks = getChunks(data, CHUNK_SIZE);
      const numberOfChunks = chunks.length;
      return [
        ...acc,
        [current[0], CHUNKED_KEY + numberOfChunks],
        ...chunks.map((chunk, index) => [key + CHUNKED_KEY + index, chunk]),
      ];
    }

    return [...acc, [key, data]];
  }, []);

const getCompressedValue = async (key, value) => {
  try {
    if (value && value.includes(CHUNKED_KEY)) {
      const numberOfChunk = Number(value.replace(CHUNKED_KEY, ""));
      const keys = [];

      for (let i = 0; i < numberOfChunk; i++) {
        keys.push(key + CHUNKED_KEY + i);
      }

      let values = [];

      // multiget will failed when you got keys with a tons of data
      // it crash with 13 CHUNKS of 1MB string so we had splice it.
      while (keys.length) {
        values = [
          ...values,
          ...(await AsyncStorage.multiGet(keys.splice(0, 5))),
        ];
      }

      const concatString = values.reduce(
        (acc, current) => acc + current[1],
        "",
      );
      return JSON.parse(concatString);
    }

    return JSON.parse(value);
  } catch (e) {
    return undefined;
  }
};

const deviceStorage = {
  /**
   * Get a one or more value for a key or array of keys from AsyncStorage
   * @param {String|Array} key A key or array of keys
   * @return {Promise}
   */
  async get(key) {
    if (!Array.isArray(key)) {
      const value = await AsyncStorage.getItem(key);
      return getCompressedValue(key, value);
    }

    const values = await AsyncStorage.multiGet(key);
    const data = values.map(value => getCompressedValue(value[0], value[1]));
    return Promise.all(data).then(array => array.filter(Boolean));
  },

  /**
   * Save a key value pair or a series of key value pairs to AsyncStorage.
   * @param  {String|Array} key The key or an array of key/value pairs
   * @param  {Any} value The value to save
   * @return {Promise}
   */
  save(key, value) {
    let pairs = [];

    if (!Array.isArray(key)) {
      pairs.push([key, value]);
    } else {
      pairs = key.map(pair => [pair[0], pair[1]]);
    }

    return AsyncStorage.multiSet(stringifyPairs(pairs));
  },

  /**
   * Updates the value in the store for a given key in AsyncStorage. If the value is a string it will be replaced. If the value is an object it will be deep merged.
   * @param  {String} key The key
   * @param  {Value} value The value to update with
   * @return {Promise}
   */
  update(key, value) {
    return deviceStorage
      .get(key)
      .then(item =>
        deviceStorage.save(
          key,
          typeof value === "string" ? value : merge({}, item, value),
        ),
      );
  },

  /**
   * Delete the value for a given key in AsyncStorage.
   * @param  {String|Array} key The key or an array of keys to be deleted
   * @return {Promise}
   */
  async delete(key) {
    let keys;
    const existingKeys = await AsyncStorage.getAllKeys();

    if (!Array.isArray(key)) {
      keys = existingKeys.filter(existingKey => existingKey.include(key));
    } else {
      keys = existingKeys.filter(existingKey =>
        key.some(keyToDelete => existingKey.includes(keyToDelete)),
      );
    }

    return AsyncStorage.multiRemove(keys);
  },

  /**
   * Get all keys in AsyncStorage.
   * @return {Promise} A promise which when it resolves gets passed the saved keys in AsyncStorage.
   */
  keys() {
    return AsyncStorage.getAllKeys().then(keys =>
      keys.filter(key => !key.includes(CHUNKED_KEY)),
    );
  },

  /**
   * Push a value onto an array stored in AsyncStorage by key or create a new array in AsyncStorage for a key if it's not yet defined.
   * @param {String} key They key
   * @param {Any} value The value to push onto the array
   * @return {Promise}
   */
  push(key, value) {
    return deviceStorage.get(key).then(currentValue => {
      if (currentValue === null) {
        // if there is no current value populate it with the new value
        return deviceStorage.save(key, [value]);
      }

      if (Array.isArray(currentValue)) {
        return deviceStorage.save(key, [...currentValue, value]);
      }

      throw new Error(
        `Existing value for key "${key}" must be of type null or Array, received ${typeof currentValue}.`,
      );
    });
  },
};
export default deviceStorage;

import { MMKV } from "react-native-mmkv";
import merge from "lodash/merge";
import { CONFIG_PARAMS } from "./constants";

/** Singleton instance of MMKV storage */
const mmkv = new MMKV({
  id: CONFIG_PARAMS.ID,
});

/** MMKV storage wrapper */
const storageWrapper = {
  /** Get all keys in MMKV. */
  keys() {
    return mmkv.getAllKeys();
  },

  /**
   * Get a one or more value for a key or array of keys from MMKV
   *
   * @param key A
   * key or array of keys
   */
  get<T>(key: string | string[]): (T | undefined) | T[] {
    if (!Array.isArray(key)) {
      const value = mmkv.getString(key);
      return value !== undefined ? (JSON.parse(value) as T) : undefined;
    }

    const data: T[] = [];
    for (const k of key) {
      const value = mmkv.getString(k);
      if (value !== undefined) {
        data.push(JSON.parse(value) as T);
      }
    }

    return data;
  },

  /**
   * Get one value from MMKV
   *
   * @param key A
   * the key
   */
  getString(key: string): string | null {
    const value = mmkv.getString(key);
    return value ?? null;
  },

  /**
   * Save a key value pair or a series of key value pairs to MMKV.
   *
   * @param key
   * The key or an array of key/value pairs
   *
   * @param value
   * The value to save
   */
  save<T>(key: string | [string, T][], value?: T) {
    if (!Array.isArray(key)) {
      if (value !== undefined) {
        mmkv.set(key, JSON.stringify(value));
      }
    } else {
      for (const [k, v] of key) {
        if (v !== undefined) {
          mmkv.set(k, JSON.stringify(v));
        }
      }
    }
  },

  /**
   * Save a key value pair to MMKV.
   *
   * @param key
   * The key
   *
   * @param value
   * The value to save
   */
  saveString(key: string, value: string) {
    mmkv.set(key, value);
  },

  /**
   * Updates the value in the store for a given key in MMKV.
   *
   * - If the value is a string it will be replaced.
   * - If the value is an object it will be deep merged.
   *
   * @param key
   * The key
   *
   * @param value
   * The value to update with
   */
  update<T>(key: string, value: T) {
    const item = storageWrapper.get(key);
    const data = typeof value === "string" ? value : merge({}, item, value);

    storageWrapper.save(key, data);
  },

  /**
   * Delete the value for a given key in `MMKV`.
   *
   * @param key
   * The key or an array of keys to be deleted
   */
  async delete(key: string | string[]) {
    if (!Array.isArray(key)) {
      if (mmkv.contains(key)) {
        mmkv.delete(key);
      }
    } else {
      for (const k of key) {
        if (mmkv.contains(k)) {
          mmkv.delete(k);
        }
      }
    }
  },

  /**
   * Push a value onto an array stored in `MMKV` by key or create
   * a new array in `MMKV` for a key if it's not yet defined.
   *
   * @param key
   * They key
   *
   * @param value
   * The value to push onto the array
   */
  push<T = unknown>(key: string, value: T) {
    const currentValue = storageWrapper.get(key);

    if (currentValue === null) {
      // if there is no current value populate it with the new value
      return storageWrapper.save(key, [value]);
    }

    if (Array.isArray(currentValue)) {
      return storageWrapper.save(key, [...currentValue, value]);
    }

    throw new Error(
      `Existing value for key "${key}" must be of type null or Array, received ${typeof currentValue}.`,
    );
  },
};

export default storageWrapper;

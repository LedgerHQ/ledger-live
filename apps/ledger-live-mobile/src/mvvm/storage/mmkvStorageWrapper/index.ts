import { MMKV } from "react-native-mmkv";
import merge from "lodash/merge";
import { CONFIG_PARAMS } from "./constants";
import { monitor } from "./monitor";

/** Singleton instance of MMKV storage */
export const mmkv = new MMKV({
  id: CONFIG_PARAMS.ID,
});

/** MMKV storage wrapper */
const storageWrapper = {
  /** Get all keys in MMKV. */
  keys() {
    return mmkv.getAllKeys();
  },

  /**
   * Enable or disable monitoring.
   * When enabled all accessed keys will be recorded.
   *
   * @param enabled Whether to enable or disable monitoring
   */
  monitor(enabled: boolean) {
    monitoredData.enabled = enabled;
  },

  /**
   * Get and clear all accessed key value pairs
   *
   * @param keepMonitoring Whether to keep monitoring after the flush
   */
  flushAccessedKeys(keepMonitoring = false) {
    const read = [...monitoredData.read];
    monitoredData.read = [];
    monitoredData.enabled = keepMonitoring;
    return read;
  },

  /**
   * Get a one or more value for a key or array of keys from MMKV
   *
   * @param key A
   * key or array of keys
   */
  get<T>(key: string | string[]): (T | undefined) | T[] {
    return monitor<(T | undefined) | T[]>("read", { key }, () => {
      if (!Array.isArray(key)) {
        const value = storageWrapper.getString(key) ?? undefined;
        saveRead(key, value);
        return value !== undefined ? (JSON.parse(value) as T) : undefined;
      }

      const data: T[] = [];
      for (const k of key) {
        const value = storageWrapper.getString(k) ?? undefined;
        saveRead(k, value);
        if (value !== undefined) {
          data.push(JSON.parse(value) as T);
        }
      }

      return data;
    });
  },

  /**
   * Get one value from MMKV
   *
   * @param key A
   * the key
   */
  getString(key: string): string | null {
    return monitor("read", { key }, () => {
      const value = mmkv.getString(key);
      saveRead(key, value);
      return value ?? null;
    });
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
    monitor("write", { key }, () => {
      if (!Array.isArray(key)) {
        if (value !== undefined) {
          storageWrapper.saveString(key, JSON.stringify(value));
        }
      } else {
        for (const [k, v] of key) {
          if (v !== undefined) {
            storageWrapper.saveString(k, JSON.stringify(v));
          }
        }
      }
    });
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
    monitor("write", { key, value }, () => {
      mmkv.set(key, value);
    });
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
   * Delete all the `MMKV` instance.
   */
  async deleteAll() {
    mmkv.clearAll();
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

  /** Stringify the storage data to JSON. */
  stringify() {
    const keys = storageWrapper.keys();
    const data = keys.reduce(
      (result, key) => {
        const value = storageWrapper.getString(key);
        result[key] = value;
        return result;
      },
      {} as Record<string, unknown>,
    );

    return JSON.stringify(data);
  },

  /** Get the total storage size **/
  size() {
    return mmkv.size;
  },
};

// TODO remove monitoredData and saveRead and replace with the data from ./monitor.ts
export type MMKVMonitoredRead = { key: string; value: string | undefined };
const monitoredData: { enabled: boolean; read: MMKVMonitoredRead[] } = { enabled: false, read: [] };

const MAX_MONITORED_READS = 1000;
function saveRead(key: string, value: string | undefined) {
  if (!monitoredData.enabled) return;
  monitoredData.read.push({ key, value });
  // For safety limit the number of stored reads
  if (monitoredData.read.length > MAX_MONITORED_READS) monitoredData.read.shift();
}

export default storageWrapper;

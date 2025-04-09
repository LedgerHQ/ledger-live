import type { Storage, StorageInitializer, StorageState } from "./types";
import asyncStorageWrapper from "./asyncStorageWrapper";
import mmkvStorageWrapper from "./mmkvStorageWrapper";
import { STORAGE_TYPE } from "./constants";

/** Singleton reference to the global application storage object. */
export default createStorage();

/** Creates the global application storage object that implements the {@link Storage} interface. */
export function createStorage(initializer: StorageInitializer = initStorageState): Storage {
  const state: StorageState = {
    storageType: "AsyncStorage",
  };

  initializer(state);
  return {
    keys() {
      try {
        return state.storageType === "MMKV"
          ? Promise.resolve(mmkvStorageWrapper.keys())
          : asyncStorageWrapper.keys();
      } catch (e) {
        console.error("Error getting keys from storage", e);
        return Promise.reject(e);
      }
    },

    get(key) {
      try {
        return state.storageType === "MMKV"
          ? Promise.resolve(mmkvStorageWrapper.get(key))
          : asyncStorageWrapper.get(key);
      } catch (e) {
        console.error("Error getting key from storage", e);
        return Promise.reject(e);
      }
    },

    save(key, value) {
      try {
        return state.storageType === "MMKV"
          ? Promise.resolve(mmkvStorageWrapper.save(key, value))
          : asyncStorageWrapper.save(key, value);
      } catch (e) {
        console.error("Error saving key to storage", e);
        return Promise.reject(e);
      }
    },

    update(key, value) {
      try {
        return state.storageType === "MMKV"
          ? Promise.resolve(mmkvStorageWrapper.update(key, value))
          : asyncStorageWrapper.update(key, value);
      } catch (e) {
        console.error("Error updating key in storage", e);
        return Promise.reject(e);
      }
    },

    delete(key) {
      try {
        return state.storageType === "MMKV"
          ? Promise.resolve(mmkvStorageWrapper.delete(key))
          : asyncStorageWrapper.delete(key);
      } catch (e) {
        console.error("Error deleting key from storage", e);
        return Promise.reject(e);
      }
    },

    push(key, value) {
      try {
        return state.storageType === "MMKV"
          ? Promise.resolve(mmkvStorageWrapper.push(key, value))
          : asyncStorageWrapper.push(key, value);
      } catch (e) {
        console.error("Error pushing value to storage", e);
        return Promise.reject(e);
      }
    },

    migrate() {
      throw new Error("Unimplemented");
    },

    resetMigration() {
      throw new Error("Unimplemented");
    },

    rollbackMigration() {
      throw new Error("Unimplemented");
    },
  } satisfies Storage;
}

/**
 * Initializes the sorage state reference.
 *
 * @param state
 * The storage state to initialize.
 */
export function initStorageState(state: StorageState): void {
  state.storageType = STORAGE_TYPE.ASYNC_STORAGE;
}

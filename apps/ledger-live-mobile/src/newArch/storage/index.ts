import type { Storage, StorageInitializer, StorageState } from "./types";
import asyncStorageWrapper from "./asyncStorageWrapper";
import mmkvStorageWrapper from "./mmkvStorageWrapper";
import { STORAGE_TYPE } from "./constants";
import { rejectWithError } from "LLM/utils/rejectWithError";

/** Singleton reference to the global application storage object. */
export default createStorage();

/** Creates the global application storage object that implements the {@link Storage} interface. */
export function createStorage(init: StorageInitializer = initStorageState): Storage {
  const state: StorageState = {
    storageType: STORAGE_TYPE.ASYNC_STORAGE,
  };

  init(state);
  return {
    keys() {
      try {
        return state.storageType === STORAGE_TYPE.MMKV
          ? Promise.resolve(mmkvStorageWrapper.keys())
          : asyncStorageWrapper.keys();
      } catch (e) {
        console.error("Error getting keys from storage", e);
        return rejectWithError(e);
      }
    },

    get(key) {
      try {
        return state.storageType === STORAGE_TYPE.MMKV
          ? Promise.resolve(mmkvStorageWrapper.get(key))
          : asyncStorageWrapper.get(key);
      } catch (e) {
        console.error("Error getting key from storage", e);
        return rejectWithError(e);
      }
    },

    getString(key) {
      try {
        return state.storageType === STORAGE_TYPE.MMKV
          ? Promise.resolve(mmkvStorageWrapper.getString(key))
          : asyncStorageWrapper.getString(key);
      } catch (e) {
        console.error("Error getting key from storage", e);
        return rejectWithError(e);
      }
    },

    save(key, value) {
      try {
        return state.storageType === STORAGE_TYPE.MMKV
          ? Promise.resolve(mmkvStorageWrapper.save(key, value))
          : asyncStorageWrapper.save(key, value);
      } catch (e) {
        console.error("Error saving key to storage", e);
        return rejectWithError(e);
      }
    },

    saveString(key, value) {
      try {
        return state.storageType === STORAGE_TYPE.MMKV
          ? Promise.resolve(mmkvStorageWrapper.saveString(key, value))
          : asyncStorageWrapper.saveString(key, value);
      } catch (e) {
        console.error("Error saving key to storage", e);
        return rejectWithError(e);
      }
    },

    update(key, value) {
      try {
        return state.storageType === STORAGE_TYPE.MMKV
          ? Promise.resolve(mmkvStorageWrapper.update(key, value))
          : asyncStorageWrapper.update(key, value);
      } catch (e) {
        console.error("Error updating key in storage", e);
        return rejectWithError(e);
      }
    },

    async delete(key) {
      try {
        return state.storageType === STORAGE_TYPE.MMKV
          ? await mmkvStorageWrapper.delete(key)
          : await asyncStorageWrapper.delete(key);
      } catch (e) {
        console.error("Error deleting key from storage", e);
        return rejectWithError(e);
      }
    },

    push(key, value) {
      try {
        return state.storageType === STORAGE_TYPE.MMKV
          ? Promise.resolve(mmkvStorageWrapper.push(key, value))
          : asyncStorageWrapper.push(key, value);
      } catch (e) {
        console.error("Error pushing value to storage", e);
        return rejectWithError(e);
      }
    },

    migrate() {
      console.warn("Not implemented yet");
    },

    resetMigration() {
      console.warn("Not implemented yet");
    },

    rollbackMigration() {
      console.warn("Not implemented yet");
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

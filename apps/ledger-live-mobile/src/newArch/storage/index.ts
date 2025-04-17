import { rejectWithError } from "LLM/utils/rejectWithError";
import type { Storage, StorageInitializer, StorageState } from "./types";
import asyncStorageWrapper from "./asyncStorageWrapper";
import mmkvStorageWrapper from "./mmkvStorageWrapper";
import { MAX_NUMBER_OF_ERRORS, STORAGE_TYPE } from "./constants";
import { migrator } from "./utils/migrations/asyncStorageToMMKV";
import { MIGRATION_STATUS, ROLLBACK_STATUS } from "./utils/migrations/constants";

/** Singleton reference to the global application storage object. */
export default createStorage();

/** Creates the global application storage object that implements the {@link Storage} interface. */
export function createStorage(init: StorageInitializer = initStorageState): Storage {
  const state: StorageState = {
    storageType: STORAGE_TYPE.ASYNC_STORAGE,
    migrationStatus: MIGRATION_STATUS.NOT_STARTED,
    rollbackStatus: ROLLBACK_STATUS.NOT_STARTED,
    numberOfReadErrors: 0,
  };

  init(state);
  return {
    getState() {
      return { ...state };
    },

    keys() {
      try {
        return state.storageType === STORAGE_TYPE.MMKV
          ? Promise.resolve(mmkvStorageWrapper.keys())
          : asyncStorageWrapper.keys();
      } catch (e) {
        console.error("Error getting keys from storage", {
          error: e,
          state: state,
        });
        return rejectWithError(e);
      }
    },

    get(key) {
      try {
        return state.storageType === STORAGE_TYPE.MMKV
          ? Promise.resolve(mmkvStorageWrapper.get(key))
          : asyncStorageWrapper.get(key);
      } catch (e) {
        console.error("Error getting key from storage", {
          error: e,
          state: state,
        });
        incrementNumberOfErrors(state, e);
        return rejectWithError(e);
      }
    },

    getString(key) {
      try {
        return state.storageType === STORAGE_TYPE.MMKV
          ? Promise.resolve(mmkvStorageWrapper.getString(key))
          : asyncStorageWrapper.getString(key);
      } catch (e) {
        console.error("Error getting key from storage", {
          error: e,
          state: state,
        });
        incrementNumberOfErrors(state, e);
        return rejectWithError(e);
      }
    },

    save(key, value) {
      try {
        return state.storageType === STORAGE_TYPE.MMKV
          ? Promise.resolve(mmkvStorageWrapper.save(key, value))
          : asyncStorageWrapper.save(key, value);
      } catch (e) {
        console.error("Error saving key to storage", {
          error: e,
          state: state,
        });
        return rejectWithError(e);
      }
    },

    saveString(key, value) {
      try {
        return state.storageType === STORAGE_TYPE.MMKV
          ? Promise.resolve(mmkvStorageWrapper.saveString(key, value))
          : asyncStorageWrapper.saveString(key, value);
      } catch (e) {
        console.error("Error saving key to storage", {
          error: e,
          state: state,
        });
        return rejectWithError(e);
      }
    },

    update(key, value) {
      try {
        return state.storageType === STORAGE_TYPE.MMKV
          ? Promise.resolve(mmkvStorageWrapper.update(key, value))
          : asyncStorageWrapper.update(key, value);
      } catch (e) {
        console.error("Error updating key in storage", {
          error: e,
          state: state,
        });
        return rejectWithError(e);
      }
    },

    async delete(key) {
      try {
        return state.storageType === STORAGE_TYPE.MMKV
          ? await mmkvStorageWrapper.delete(key)
          : await asyncStorageWrapper.delete(key);
      } catch (e) {
        console.error("Error deleting key from storage", {
          error: e,
          state: state,
        });
        return rejectWithError(e);
      }
    },

    async deleteAll() {
      try {
        return state.storageType === STORAGE_TYPE.MMKV
          ? await mmkvStorageWrapper.deleteAll()
          : await asyncStorageWrapper.deleteAll();
      } catch (e) {
        console.error("Error deleting all keys from storage", {
          error: e,
          state: state,
        });
        return rejectWithError(e);
      }
    },

    push(key, value) {
      try {
        return state.storageType === STORAGE_TYPE.MMKV
          ? Promise.resolve(mmkvStorageWrapper.push(key, value))
          : asyncStorageWrapper.push(key, value);
      } catch (e) {
        console.error("Error pushing value to storage", {
          error: e,
          state: state,
        });
        return rejectWithError(e);
      }
    },

    stringify() {
      try {
        return state.storageType === STORAGE_TYPE.MMKV
          ? Promise.resolve(mmkvStorageWrapper.stringify())
          : asyncStorageWrapper.stringify();
      } catch (e) {
        console.error("Error pushing value to storage", {
          error: e,
          state: state,
        });
        return rejectWithError(e);
      }
    },

    async migrate() {
      try {
        await migrator.migrate(state);
      } catch (e) {
        console.error("Error while migrating storage", {
          error: e,
          state: state,
        });
        return rejectWithError(e);
      }
    },

    async resetMigration() {
      try {
        await migrator.resetMigration(state);
      } catch (e) {
        console.error("Error while resetting migration", {
          error: e,
          state: state,
        });
        return rejectWithError(e);
      }
    },

    async rollbackMigration() {
      try {
        await migrator.rollbackToAsyncStorage(state);
      } catch (e) {
        console.error("Error while rolling back migration", {
          error: e,
          state: state,
        });
        return rejectWithError(e);
      }
    },

    async handleMigration() {
      try {
        await migrator.handleMigration(state);
      } catch (e) {
        console.error("Error handling migration", {
          error: e,
          state: state,
        });
        return rejectWithError(e);
      }
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

function incrementNumberOfErrors(state: StorageState, error: unknown): void {
  if (!(error instanceof SyntaxError)) return;

  if (state.storageType === STORAGE_TYPE.MMKV) {
    if (state.numberOfReadErrors && state.numberOfReadErrors >= MAX_NUMBER_OF_ERRORS) {
      migrator.rollbackToAsyncStorage(state);
    } else {
      state.numberOfReadErrors = state.numberOfReadErrors + 1;
    }
  }
}

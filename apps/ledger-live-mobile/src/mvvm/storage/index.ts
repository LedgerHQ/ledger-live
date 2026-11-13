import { track } from "@shared/analytics";
import { rejectWithError } from "LLM/utils/rejectWithError";
import type { Storage, StorageInitializer, StorageState } from "./types";
import asyncStorageWrapper from "./asyncStorageWrapper";
import mmkvStorageWrapper from "./mmkvStorageWrapper";
import { STORAGE_TYPE } from "./constants";
import { migrator } from "./utils/migrations/asyncStorageToMMKV";
import { MIGRATION_STATUS, MIGRATION_STATUS_KEY } from "./utils/migrations/constants";

/** Singleton reference to the global application storage object. */
export default createStorage();

/** Creates the global application storage object that implements the {@link Storage} interface. */
export function createStorage(init: StorageInitializer = initStorageState): Storage {
  const state: StorageState = {
    storageType: STORAGE_TYPE.ASYNC_STORAGE,
    migrationStatus: MIGRATION_STATUS.NOT_STARTED,
    numberOfReadErrors: 0,
  };

  const incrementNumberOfErrorsDebug = incrementNumberOfErrors.bind(null, state);

  const ready = runInitializer(init, state);

  return {
    getState() {
      return { ...state };
    },

    incrementNumberOfErrorsDebug,

    async keys() {
      try {
        await ready;
        return state.storageType === STORAGE_TYPE.MMKV
          ? await mmkvStorageWrapper.keys()
          : await asyncStorageWrapper.keys();
      } catch (e) {
        console.error("Error getting keys from storage", {
          error: e,
          state: state,
        });
        return rejectWithError({ e, extraData: { op: "keys" } });
      }
    },

    async get<T>(key: string | string[]) {
      try {
        await ready;
        return state.storageType === STORAGE_TYPE.MMKV
          ? mmkvStorageWrapper.get<T>(key)
          : await asyncStorageWrapper.get<T>(key);
      } catch (e) {
        console.error("Error getting key from storage", {
          error: e,
          state: state,
        });
        incrementNumberOfErrors(state, e);
        return rejectWithError({ e, extraData: { op: "get", key } });
      }
    },

    async getString(key) {
      try {
        await ready;
        return state.storageType === STORAGE_TYPE.MMKV
          ? mmkvStorageWrapper.getString(key)
          : await asyncStorageWrapper.getString(key);
      } catch (e) {
        console.error("Error getting key from storage", {
          error: e,
          state: state,
        });
        incrementNumberOfErrors(state, e);
        return rejectWithError({ e, extraData: { op: "getString", key } });
      }
    },

    async save(key, value) {
      try {
        await ready;
        return state.storageType === STORAGE_TYPE.MMKV
          ? mmkvStorageWrapper.save(key, value)
          : await asyncStorageWrapper.save(key, value);
      } catch (e) {
        console.error("Error saving key to storage", {
          error: e,
          state: state,
        });
        return rejectWithError({ e, extraData: { op: "save", key, value } });
      }
    },

    async saveString(key, value) {
      try {
        await ready;
        return state.storageType === STORAGE_TYPE.MMKV
          ? mmkvStorageWrapper.saveString(key, value)
          : await asyncStorageWrapper.saveString(key, value);
      } catch (e) {
        console.error("Error saving key to storage", {
          error: e,
          state: state,
        });
        return rejectWithError({ e, extraData: { op: "saveString", key } });
      }
    },

    async update(key, value) {
      try {
        await ready;
        return state.storageType === STORAGE_TYPE.MMKV
          ? mmkvStorageWrapper.update(key, value)
          : await asyncStorageWrapper.update(key, value);
      } catch (e) {
        console.error("Error updating key in storage", {
          error: e,
          state: state,
        });
        return rejectWithError({ e, extraData: { op: "update", key } });
      }
    },

    async delete(key) {
      try {
        await ready;
        return state.storageType === STORAGE_TYPE.MMKV
          ? await mmkvStorageWrapper.delete(key)
          : await asyncStorageWrapper.delete(key);
      } catch (e) {
        console.error("Error deleting key from storage", {
          error: e,
          state: state,
        });
        return rejectWithError({ e, extraData: { op: "delete", key } });
      }
    },

    async deleteAll() {
      try {
        await ready;
        return state.storageType === STORAGE_TYPE.MMKV
          ? await mmkvStorageWrapper.deleteAll()
          : await asyncStorageWrapper.deleteAll();
      } catch (e) {
        console.error("Error deleting all keys from storage", {
          error: e,
          state: state,
        });
        return rejectWithError({ e, extraData: { op: "deleteAll" } });
      }
    },

    async push(key, value) {
      try {
        await ready;
        return state.storageType === STORAGE_TYPE.MMKV
          ? mmkvStorageWrapper.push(key, value)
          : await asyncStorageWrapper.push(key, value);
      } catch (e) {
        console.error("Error pushing value to storage", {
          error: e,
          state: state,
        });
        return rejectWithError({ e, extraData: { op: "push", key, value } });
      }
    },

    async stringify() {
      try {
        await ready;
        return state.storageType === STORAGE_TYPE.MMKV
          ? mmkvStorageWrapper.stringify()
          : await asyncStorageWrapper.stringify();
      } catch (e) {
        console.error("Error stringifying storage", {
          error: e,
          state: state,
        });
        return rejectWithError({ e, extraData: { op: "stringify" } });
      }
    },

    async migrate() {
      try {
        await ready;
        await migrator.migrate(state);
      } catch (e) {
        console.error("Error while migrating storage", {
          error: e,
          state: state,
        });
        return rejectWithError({ e, extraData: { op: "migrate" } });
      }
    },

    async resetMigration() {
      try {
        await ready;
        await migrator.resetMigration(state);
      } catch (e) {
        console.error("Error while resetting migration", {
          error: e,
          state: state,
        });
        return rejectWithError({ e, extraData: { op: "resetMigration" } });
      }
    },

    async handleMigration() {
      try {
        await ready;
        await migrator.handleMigration(state);
      } catch (e) {
        console.error("Error handling migration", {
          error: e,
          state: state,
        });
        return rejectWithError({ e, extraData: { op: "handleMigration" } });
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
export async function initStorageState(state: StorageState): Promise<void> {
  const migrationStatus = mmkvStorageWrapper.getString(MIGRATION_STATUS_KEY);

  if (migrationStatus === MIGRATION_STATUS.COMPLETED) {
    state.storageType = STORAGE_TYPE.MMKV;
    state.migrationStatus = MIGRATION_STATUS.COMPLETED;
    return;
  }

  if (migrationStatus !== null) return;

  const nothingInAsyncStorage = (await asyncStorageWrapper.keys()).length === 0;
  if (nothingInAsyncStorage) {
    mmkvStorageWrapper.saveString(MIGRATION_STATUS_KEY, MIGRATION_STATUS.COMPLETED);
    state.storageType = STORAGE_TYPE.MMKV;
    state.migrationStatus = MIGRATION_STATUS.COMPLETED;
  }
}

/**
 * Runs the initializer synchronously, so a synchronous state change applies at once.
 * The returned promise never rejects: on error, the storage stays on AsyncStorage.
 */
function runInitializer(init: StorageInitializer, state: StorageState): Promise<void> {
  try {
    return Promise.resolve(init(state)).catch(logInitError);
  } catch (e) {
    logInitError(e);
    return Promise.resolve();
  }
}

function logInitError(error: unknown): void {
  console.warn("Failed to initialize storage, staying on AsyncStorage", error);
}

function incrementNumberOfErrors(state: StorageState, error: unknown): void {
  if (!(error instanceof SyntaxError)) return;

  track("StorageError", {
    error: error.name,
    stackTrace: error.stack || "",
    state,
  });

  if (state.storageType === STORAGE_TYPE.MMKV) {
    state.numberOfReadErrors = state.numberOfReadErrors + 1;
    state.lastError = {
      stackTrace: error.stack || "",
      key: error.name,
    };
  }
}

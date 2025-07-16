import { rejectWithError } from "LLM/utils/rejectWithError";
import type { Storage, StorageInitializer, StorageState } from "./types";
import asyncStorageWrapper from "./asyncStorageWrapper";
import mmkvStorageWrapper from "./mmkvStorageWrapper";
import { MAX_NUMBER_OF_ERRORS, STORAGE_TYPE } from "./constants";
import { migrator } from "./utils/migrations/asyncStorageToMMKV";
import {
  MIGRATION_STATUS,
  MIGRATION_STATUS_KEY,
  ROLLBACK_STATUS,
  ROLLBACK_STATUS_KEY,
} from "./utils/migrations/constants";
import { track } from "~/analytics";
import type { Feature_LlmMmkvMigration } from "@ledgerhq/types-live";
import { trackStorageOperation } from "./utils/performance";

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

  const incrementNumberOfErrorsDebug = incrementNumberOfErrors.bind(null, state);

  init(state);
  return {
    getState() {
      return { ...state };
    },

    incrementNumberOfErrorsDebug,

    async keys() {
      try {
        return state.storageType === STORAGE_TYPE.MMKV
          ? await trackStorageOperation("keys", STORAGE_TYPE.MMKV, "all", () =>
              Promise.resolve(mmkvStorageWrapper.keys()),
            )
          : await trackStorageOperation("keys", STORAGE_TYPE.ASYNC_STORAGE, "all", () =>
              asyncStorageWrapper.keys(),
            );
      } catch (e) {
        console.error("Error getting keys from storage", {
          error: e,
          state: state,
        });
        return rejectWithError({ e, extraData: { op: "keys" } });
      }
    },

    async get(key) {
      try {
        return state.storageType === STORAGE_TYPE.MMKV
          ? await trackStorageOperation("get", STORAGE_TYPE.MMKV, key, () =>
              Promise.resolve(mmkvStorageWrapper.get(key)),
            )
          : await trackStorageOperation("get", STORAGE_TYPE.ASYNC_STORAGE, key, () =>
              asyncStorageWrapper.get(key),
            );
      } catch (e) {
        console.error("Error getting key from storage", {
          error: e,
          state: state,
        });
        await incrementNumberOfErrors(state, e);
        return rejectWithError({ e, extraData: { op: "get", key } });
      }
    },

    async getString(key) {
      try {
        return state.storageType === STORAGE_TYPE.MMKV
          ? await trackStorageOperation("getString", STORAGE_TYPE.MMKV, key, () =>
              Promise.resolve(mmkvStorageWrapper.getString(key)),
            )
          : await trackStorageOperation("getString", STORAGE_TYPE.ASYNC_STORAGE, key, () =>
              asyncStorageWrapper.getString(key),
            );
      } catch (e) {
        console.error("Error getting key from storage", {
          error: e,
          state: state,
        });
        await incrementNumberOfErrors(state, e);
        return rejectWithError({ e, extraData: { op: "getString", key } });
      }
    },

    async save(key, value) {
      try {
        return state.storageType === STORAGE_TYPE.MMKV
          ? await trackStorageOperation("save", STORAGE_TYPE.MMKV, key as string, () =>
              Promise.resolve(mmkvStorageWrapper.save(key, value)),
            )
          : await trackStorageOperation("save", STORAGE_TYPE.ASYNC_STORAGE, key as string, () =>
              asyncStorageWrapper.save(key, value),
            );
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
        return state.storageType === STORAGE_TYPE.MMKV
          ? await trackStorageOperation("saveString", STORAGE_TYPE.MMKV, key, () =>
              Promise.resolve(mmkvStorageWrapper.saveString(key, value)),
            )
          : await trackStorageOperation("saveString", STORAGE_TYPE.ASYNC_STORAGE, key, () =>
              asyncStorageWrapper.saveString(key, value),
            );
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
        return state.storageType === STORAGE_TYPE.MMKV
          ? await trackStorageOperation("update", STORAGE_TYPE.MMKV, key, () =>
              Promise.resolve(mmkvStorageWrapper.update(key, value)),
            )
          : await trackStorageOperation("update", STORAGE_TYPE.ASYNC_STORAGE, key, () =>
              asyncStorageWrapper.update(key, value),
            );
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
        return state.storageType === STORAGE_TYPE.MMKV
          ? await trackStorageOperation("delete", STORAGE_TYPE.MMKV, key, () =>
              mmkvStorageWrapper.delete(key),
            )
          : await trackStorageOperation("delete", STORAGE_TYPE.ASYNC_STORAGE, key, () =>
              asyncStorageWrapper.delete(key),
            );
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
        return state.storageType === STORAGE_TYPE.MMKV
          ? await trackStorageOperation("deleteAll", STORAGE_TYPE.MMKV, "all", () =>
              mmkvStorageWrapper.deleteAll(),
            )
          : await trackStorageOperation("deleteAll", STORAGE_TYPE.ASYNC_STORAGE, "all", () =>
              asyncStorageWrapper.deleteAll(),
            );
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
        return state.storageType === STORAGE_TYPE.MMKV
          ? await trackStorageOperation("push", STORAGE_TYPE.MMKV, key, () =>
              Promise.resolve(mmkvStorageWrapper.push(key, value)),
            )
          : await trackStorageOperation("push", STORAGE_TYPE.ASYNC_STORAGE, key, () =>
              asyncStorageWrapper.push(key, value),
            );
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
        return state.storageType === STORAGE_TYPE.MMKV
          ? await trackStorageOperation("stringify", STORAGE_TYPE.MMKV, "all", () =>
              Promise.resolve(mmkvStorageWrapper.stringify()),
            )
          : await trackStorageOperation("stringify", STORAGE_TYPE.ASYNC_STORAGE, "all", () =>
              asyncStorageWrapper.stringify(),
            );
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
        await migrator.resetMigration(state);
      } catch (e) {
        console.error("Error while resetting migration", {
          error: e,
          state: state,
        });
        return rejectWithError({ e, extraData: { op: "resetMigration" } });
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
        return rejectWithError({ e, extraData: { op: "rollbackMigration" } });
      }
    },

    async handleMigration(featureFlag: Feature_LlmMmkvMigration) {
      try {
        await migrator.handleMigration(state, featureFlag);
      } catch (e) {
        console.error("Error handling migration", {
          error: e,
          state: state,
        });
        return rejectWithError({ e, extraData: { op: "handleMigration", featureFlag } });
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
  const isMMKVReady =
    mmkvStorageWrapper.getString(MIGRATION_STATUS_KEY) === MIGRATION_STATUS.COMPLETED;

  const hasRolledBack =
    mmkvStorageWrapper.getString(ROLLBACK_STATUS_KEY) === ROLLBACK_STATUS.COMPLETED;

  if (hasRolledBack) {
    state.storageType = STORAGE_TYPE.ASYNC_STORAGE;
    state.migrationStatus = MIGRATION_STATUS.ROLLED_BACK;
    state.rollbackStatus = ROLLBACK_STATUS.COMPLETED;
    return;
  }

  if (isMMKVReady) {
    state.storageType = STORAGE_TYPE.MMKV;
    state.migrationStatus = MIGRATION_STATUS.COMPLETED;
    state.rollbackStatus = ROLLBACK_STATUS.NOT_STARTED;
    return;
  }
}

async function incrementNumberOfErrors(state: StorageState, error: unknown): Promise<void> {
  if (!(error instanceof SyntaxError)) return;

  track("StorageError", {
    error: error.name,
    stackTrace: error.stack || "",
    state,
  });

  if (state.storageType === STORAGE_TYPE.MMKV) {
    if (state.numberOfReadErrors && state.numberOfReadErrors >= MAX_NUMBER_OF_ERRORS) {
      state.lastError = {
        stackTrace: error.stack || "",
        key: error.name,
      };
      await migrator.rollbackToAsyncStorage(state);
    } else {
      state.numberOfReadErrors = state.numberOfReadErrors + 1;
    }
  }
}

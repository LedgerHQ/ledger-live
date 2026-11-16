import { log } from "@ledgerhq/logs";
import type { StorageState } from "LLM/storage/types";
import { STORAGE_TYPE } from "LLM/storage/constants";
import { MIGRATION_STATUS_KEY, MIGRATION_STATUS } from "./constants";
import mmkvStorage from "LLM/storage/mmkvStorageWrapper";
import asyncStorage, { CHUNKED_KEY } from "LLM/storage/asyncStorageWrapper";
import { MigrationStatus } from "./types";
import { trackStorageMigration } from "./analytics";

export const migrator = {
  /**
   * Migrates from {@link AsyncStorage} to {@link MMKV} unless the migration is completed.
   *
   * @param state
   * The current state of the application storage.
   */
  async handleMigration(state: StorageState): Promise<boolean> {
    if (state.migrationStatus === MIGRATION_STATUS.COMPLETED) return false;

    log("Storage", "Running migration...");
    return migrator.migrate(state);
  },

  /**
   * Migrates internal application {@link Storage} from {@link AsyncStorage} to {@link MMKV}.
   *
   * @param state
   * The current state of the application storage.
   */
  async migrate(state: StorageState): Promise<boolean> {
    try {
      log("Storage", "Starting migration from AsyncStorage to MMKV...");

      migrator.markMigrationStatusInProgress(state);
      await migrator.migrateData();
      migrator.markMigrationStatusCompleted(state);
      migrator.selectMMKVStorage(state);

      log("Storage", "Migration completed");
      return true;
    } catch (error) {
      console.error("Failed to migrate from AsyncStorage to MMKV!", error);
      return false;
    }
  },

  /**
   * Migrates all data from {@link AsyncStorage} to {@link MMKV}.
   */
  async migrateData() {
    await asyncStorage.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => !key.includes(CHUNKED_KEY))
          .map(key =>
            asyncStorage.getString(key).then(value => {
              if (value !== null) {
                mmkvStorage.saveString(key, value);
              }
            }),
          ),
      ),
    );
  },

  /**
   * Reset the migration status
   *
   * @param state
   * The current state of the application storage.
   */
  async resetMigration(state: StorageState) {
    migrator.markMigrationStatusNotStarted(state);

    state.numberOfReadErrors = 0;
    state.lastError = undefined;

    try {
      await mmkvStorage.deleteAll();
    } catch (e) {
      console.warn("Failed to delete all data from MMKV during reset", e);
    }
  },

  /**
   * Sets the {@link StorageState} to {@link STORAGE_TYPE.MMKV}.
   *
   * @param state
   * The current state of the application storage.
   */
  selectMMKVStorage(state: StorageState) {
    state.storageType = STORAGE_TYPE.MMKV;
  },

  /**
   * Sets the migration status to {@link MigrationStatus}.
   *
   * @param state
   * The current state of the application storage.
   */
  markMigrationStatusNotStarted(state: StorageState) {
    migrator.setMigrationStatus(state, MIGRATION_STATUS.NOT_STARTED);
    trackStorageMigration(STORAGE_TYPE.ASYNC_STORAGE);
  },

  /**
   * Sets the migration status to {@link MigrationStatus}.
   *
   * @param state
   * The current state of the application storage.
   */
  markMigrationStatusInProgress(state: StorageState) {
    migrator.setMigrationStatus(state, MIGRATION_STATUS.IN_PROGRESS);
    trackStorageMigration(STORAGE_TYPE.ASYNC_STORAGE);
  },

  /**
   * Sets the migration status to {@link MigrationStatus}.
   *
   * @param state
   * The current state of the application storage.
   */
  markMigrationStatusCompleted(state: StorageState) {
    migrator.setMigrationStatus(state, MIGRATION_STATUS.COMPLETED);
    trackStorageMigration(STORAGE_TYPE.ASYNC_STORAGE);
  },

  /**
   * Sets the migration status to {@link MigrationStatus}.
   *
   * @param state
   * The current state of the application storage.
   *
   * @param status
   * The status to set.
   */
  setMigrationStatus(state: StorageState, status: MigrationStatus) {
    mmkvStorage.saveString(MIGRATION_STATUS_KEY, status);
    state.migrationStatus = status;
  },
};

import { log } from "@ledgerhq/logs";
import type { StorageState } from "LLM/storage/types";
import { STORAGE_TYPE } from "LLM/storage/constants";
import {
  MIGRATION_STATUS_KEY,
  MIGRATION_STATUS,
  ROLLBACK_STATUS,
  ROLLBACK_STATUS_KEY,
} from "./constants";
import mmkvStorage from "LLM/storage/mmkvStorageWrapper";
import asyncStorage, { CHUNKED_KEY } from "LLM/storage/asyncStorageWrapper";
import { MigrationStatus, RollbackStatus } from "./types";
import { getFeature } from "@ledgerhq/live-common/featureFlags/firebaseFeatureFlags";
import { trackStorageMigration } from "./analytics";

export const migrator = {
  /**
   * Handles the migration process from {@link AsyncStorage} to {@link MMKV}.
   *
   * 1. If feature flag param `rollback` is active and current migration status is not rolled-back:
   *    - Runs rollback
   *    - Continue
   * 2. If migration status is set to rolled-back
   *    - Restores storage type to {@link AsyncStorage}
   *    - End
   * 3. Else if migration status is completed
   *    - Run migration
   *    - End
   *
   * @param state
   * The current state of the application storage.
   */
  async handleMigration(state: StorageState): Promise<boolean> {
    try {
      const feature = getFeature({ key: "llmMmkvMigration" });
      if (!feature?.enabled) return false;

      const shouldRollback = feature.params?.shouldRollback ?? false;

      if (
        shouldRollback &&
        state.migrationStatus !== MIGRATION_STATUS.ROLLED_BACK &&
        state.storageType === STORAGE_TYPE.MMKV
      ) {
        log("Storage", "Running rollback...");
        await migrator.rollbackToAsyncStorage(state);
        return true;
      }

      if (state.migrationStatus === MIGRATION_STATUS.ROLLED_BACK) {
        log("Storage", "Migration status is rolled-back, restoring AsyncStorage...");
        migrator.selectAsyncStorage(state);
        return false;
      }

      if (state.migrationStatus !== MIGRATION_STATUS.COMPLETED) {
        log("Storage", "Running rollback...");
        migrator.migrate(state);
        return true;
      }
    } catch (e) {
      console.error("Error during migration rollback", e);
      await migrator.rollbackToAsyncStorage(state);
    }
    return false;
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

      log("Storage", "Migration");
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
   * Rollback the migration from {@link MMKV} to {@link AsyncStorage}.
   *
   * @param state
   * The current state of the application storage.
   */
  async rollbackToAsyncStorage(state: StorageState): Promise<boolean> {
    if (
      state.migrationStatus === MIGRATION_STATUS.NOT_STARTED ||
      state.storageType === STORAGE_TYPE.ASYNC_STORAGE
    ) {
      console.warn(
        "Storage",
        "Rollback skipped: Migration has not started or storage is already AsyncStorage.",
      );
      return false;
    }

    migrator.markRollbackStatusInProgress(state);
    migrator.selectAsyncStorage(state);

    try {
      await mmkvStorage.deleteAll();
    } catch (e) {
      console.warn("Failed to delete all data from MMKV during rollback", e);
    }

    migrator.markMigrationStatusRollbacked(state);
    migrator.markRollbackStatusCompleted(state);

    state.numberOfReadErrors = 0;
    state.lastError = undefined;

    return true;
  },

  /**
   * Reset the migration status
   *
   * @param state
   * The current state of the application storage.
   */
  async resetMigration(state: StorageState) {
    migrator.markMigrationStatusNotStarted(state);
    migrator.markRollbackStatusNotStarted(state);

    state.numberOfReadErrors = 0;
    state.lastError = undefined;

    try {
      await mmkvStorage.deleteAll();
    } catch (e) {
      console.warn("Failed to delete all data from MMKV during reset", e);
    }
  },

  /**
   * Sets the {@link StorageState.storageType} to {@link STORAGE_TYPE.ASYNC_STORAGE}.
   *
   * @param state
   * The current state of the application storage.
   */
  selectAsyncStorage(state: StorageState) {
    state.storageType = STORAGE_TYPE.ASYNC_STORAGE;
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
   */
  markMigrationStatusRollbacked(state: StorageState) {
    migrator.setMigrationStatus(state, MIGRATION_STATUS.ROLLED_BACK);
    trackStorageMigration(STORAGE_TYPE.MMKV);
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

  /**
   * Sets the migration status to {@link MigrationStatus}.
   *
   * @param state
   * The current state of the application storage.
   */
  markRollbackStatusNotStarted(state: StorageState) {
    migrator.setRollbackStatus(state, ROLLBACK_STATUS.NOT_STARTED);
  },

  /**
   * Sets the migration status to {@link MigrationStatus}.
   *
   * @param state
   * The current state of the application storage.
   */
  markRollbackStatusInProgress(state: StorageState) {
    migrator.setRollbackStatus(state, ROLLBACK_STATUS.IN_PROGRESS);
  },

  /**
   * Sets the migration status to {@link MigrationStatus}.
   *
   * @param state
   * The current state of the application storage.
   */
  markRollbackStatusCompleted(state: StorageState) {
    migrator.setRollbackStatus(state, ROLLBACK_STATUS.COMPLETED);
  },

  /**
   * Sets the migration status to {@link RollbackStatus}.
   *
   * @param state
   * The current state of the application storage.
   *
   * @param status
   * The status to set.
   */
  setRollbackStatus(state: StorageState, status: RollbackStatus) {
    mmkvStorage.saveString(ROLLBACK_STATUS_KEY, status);
    state.rollbackStatus = status;
    trackStorageMigration(STORAGE_TYPE.MMKV);
  },
};

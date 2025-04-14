import { log } from "@ledgerhq/logs";
import type { StorageState } from "~/newArch/storage/types";
import { STORAGE_TYPE } from "~/newArch/storage/constants";
import { MIGRATION_STATUS_KEY, MIGRATION_STATUS } from "./constants";
import mmkvStorage from "~/newArch/storage/mmkvStorageWrapper";
import asyncStorage, { CHUNKED_KEY } from "~/newArch/storage/asyncStorageWrapper";
import { MigrationStatus } from "./types";
import { getFeature } from "@ledgerhq/live-common/featureFlags/firebaseFeatureFlags";

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

      // TODO: Rollback block

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
      migrator.migrateData();
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
  markMigrationStatusInProgress(state: StorageState) {
    migrator.setMigrationStatus(state, MIGRATION_STATUS.IN_PROGRESS);
  },

  /**
   * Sets the migration status to {@link MigrationStatus}.
   *
   * @param state
   * The current state of the application storage.
   */
  markMigrationStatusCompleted(state: StorageState) {
    migrator.setMigrationStatus(state, MIGRATION_STATUS.COMPLETED);
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

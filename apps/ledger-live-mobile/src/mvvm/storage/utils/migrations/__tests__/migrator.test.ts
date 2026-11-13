import { track } from "@shared/analytics";
import { migrator } from "../asyncStorageToMMKV";
import { STORAGE_TYPE } from "LLM/storage/constants";
import { MIGRATION_STATUS, MIGRATION_STATUS_KEY } from "../constants";
import type { StorageState } from "LLM/storage/types";
import mmkvStorage from "LLM/storage/mmkvStorageWrapper";

describe("migrator", () => {
  let state: StorageState;

  beforeEach(() => {
    jest.restoreAllMocks();
    state = {
      storageType: STORAGE_TYPE.ASYNC_STORAGE,
      migrationStatus: MIGRATION_STATUS.NOT_STARTED,
      numberOfReadErrors: 0,
    };
  });

  describe("MIGRATE_STATUS", () => {
    let setMigrateStatusSpy: jest.SpyInstance;

    beforeEach(() => {
      setMigrateStatusSpy = jest.spyOn(migrator, "setMigrationStatus").mockImplementation(() => {});
    });

    it("should set migration status to NOT_STARTED #markMigrationStatusNotStarted", () => {
      migrator.markMigrationStatusNotStarted(state);
      expect(setMigrateStatusSpy).toHaveBeenCalledWith(state, MIGRATION_STATUS.NOT_STARTED);
    });

    it("should set migration status to IN_PROGRESS #markMigrationStatusInProgress", () => {
      migrator.markMigrationStatusInProgress(state);
      expect(setMigrateStatusSpy).toHaveBeenCalledWith(state, MIGRATION_STATUS.IN_PROGRESS);
    });

    it("should set migration status to COMPLETED #markMigrationStatusCompleted", () => {
      migrator.markMigrationStatusCompleted(state);
      expect(setMigrateStatusSpy).toHaveBeenCalledWith(state, MIGRATION_STATUS.COMPLETED);
    });
  });

  describe("#setMigrationStatus", () => {
    let saveStringSpy: jest.SpyInstance;

    beforeEach(() => {
      saveStringSpy = jest.spyOn(mmkvStorage, "saveString").mockImplementation(() => undefined);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });
    it("should update the migration status in the state and call saveString", () => {
      const newStatus = MIGRATION_STATUS.IN_PROGRESS;

      migrator.setMigrationStatus(state, newStatus);
      expect(saveStringSpy).toHaveBeenCalledWith(MIGRATION_STATUS_KEY, newStatus);
    });

    it("should update the migration status in the state", () => {
      const newStatus = MIGRATION_STATUS.IN_PROGRESS;

      migrator.setMigrationStatus(state, newStatus);
      expect(state.migrationStatus).toBe(newStatus);
    });
  });

  describe("#selectMMKVStorage", () => {
    it("should set the storage type to MMKV", () => {
      migrator.selectMMKVStorage(state);

      expect(state.storageType).toBe(STORAGE_TYPE.MMKV);
    });
  });
  describe("analytics", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      state.storageType = STORAGE_TYPE.MMKV;
      state.migrationStatus = MIGRATION_STATUS.COMPLETED;
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    const toMMKV = { from: STORAGE_TYPE.ASYNC_STORAGE, to: STORAGE_TYPE.MMKV };

    it("should track migration status to NOT_STARTED", () => {
      migrator.markMigrationStatusNotStarted(state);
      expect(track).toHaveBeenCalledTimes(1);
      expect(track).toHaveBeenCalledWith("StorageMigration", expect.objectContaining(toMMKV));
    });

    it("should track migration status to IN_PROGRESS", () => {
      migrator.markMigrationStatusInProgress(state);
      expect(track).toHaveBeenCalledTimes(1);
      expect(track).toHaveBeenCalledWith("StorageMigration", expect.objectContaining(toMMKV));
    });

    it("should track migration status to COMPLETED", () => {
      migrator.markMigrationStatusCompleted(state);
      expect(track).toHaveBeenCalledTimes(1);
      expect(track).toHaveBeenCalledWith("StorageMigration", expect.objectContaining(toMMKV));
    });
  });
});

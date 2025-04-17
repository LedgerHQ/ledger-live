import { migrator } from "../asyncStorageToMMKV";
import { STORAGE_TYPE } from "LLM/storage/constants";
import {
  MIGRATION_STATUS,
  MIGRATION_STATUS_KEY,
  ROLLBACK_STATUS,
  ROLLBACK_STATUS_KEY,
} from "../constants";
import type { StorageState } from "LLM/storage/types";
import mmkvStorage from "LLM/storage/mmkvStorageWrapper";

describe("migrator", () => {
  let state: StorageState;

  beforeEach(() => {
    jest.restoreAllMocks();
    state = {
      storageType: STORAGE_TYPE.ASYNC_STORAGE,
      migrationStatus: MIGRATION_STATUS.NOT_STARTED,
      rollbackStatus: ROLLBACK_STATUS.NOT_STARTED,
      numberOfReadErrors: 0,
    };
  });

  describe("ROLLBACK_STATUS", () => {
    let setRollbackStatusSpy: jest.SpyInstance;

    beforeEach(() => {
      state.storageType = STORAGE_TYPE.MMKV;
      state.migrationStatus = MIGRATION_STATUS.COMPLETED;

      setRollbackStatusSpy = jest.spyOn(migrator, "setRollbackStatus").mockImplementation(() => {});
    });

    it("should set rollback status to NOT_STARTED #markRollbackStatusNotStarted", () => {
      migrator.markRollbackStatusNotStarted(state);
      expect(setRollbackStatusSpy).toHaveBeenCalledWith(state, ROLLBACK_STATUS.NOT_STARTED);
    });

    it("should set rollback status to IN_PROGRESS #markRollbackStatusInProgress", () => {
      migrator.markRollbackStatusInProgress(state);
      expect(setRollbackStatusSpy).toHaveBeenCalledWith(state, ROLLBACK_STATUS.IN_PROGRESS);
    });

    it("should set rollback status to COMPLETED #markRollbackStatusCompleted", () => {
      migrator.markRollbackStatusCompleted(state);
      expect(setRollbackStatusSpy).toHaveBeenCalledWith(state, ROLLBACK_STATUS.COMPLETED);
    });
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

    it("should set migration status to ROLLED_BACK #markMigrationStatusRollbacked", () => {
      migrator.markMigrationStatusRollbacked(state);
      expect(setMigrateStatusSpy).toHaveBeenCalledWith(state, MIGRATION_STATUS.ROLLED_BACK);
    });
  });

  describe("#setRollbackStatus", () => {
    let saveStringSpy: jest.SpyInstance;

    beforeEach(() => {
      saveStringSpy = jest.spyOn(mmkvStorage, "saveString").mockImplementation(() => undefined);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should update the rollback status in the state and call saveString", () => {
      const newStatus = ROLLBACK_STATUS.IN_PROGRESS;

      migrator.setRollbackStatus(state, newStatus);
      expect(saveStringSpy).toHaveBeenCalledWith(ROLLBACK_STATUS_KEY, newStatus);
    });

    it("should update the rollback status in the state", () => {
      const newStatus = ROLLBACK_STATUS.IN_PROGRESS;

      migrator.setRollbackStatus(state, newStatus);
      expect(state.rollbackStatus).toBe(newStatus);
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
    it("should update the rollback status in the state and call saveString", () => {
      const newStatus = MIGRATION_STATUS.IN_PROGRESS;

      migrator.setMigrationStatus(state, newStatus);
      expect(saveStringSpy).toHaveBeenCalledWith(MIGRATION_STATUS_KEY, newStatus);
    });

    it("should update the rollback status in the state", () => {
      const newStatus = MIGRATION_STATUS.IN_PROGRESS;

      migrator.setMigrationStatus(state, newStatus);
      expect(state.migrationStatus).toBe(newStatus);
    });
  });

  describe("#selectAsyncStorage", () => {
    it("should set the storage type to AsyncStorage", () => {
      migrator.selectAsyncStorage(state);

      expect(state.storageType).toBe(STORAGE_TYPE.ASYNC_STORAGE);
    });
  });

  describe("#selectMMKVStorage", () => {
    it("should set the storage type to MMKV", () => {
      migrator.selectMMKVStorage(state);

      expect(state.storageType).toBe(STORAGE_TYPE.MMKV);
    });
  });
});

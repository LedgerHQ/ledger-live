import asyncStorageWrapper from "LLM/storage/asyncStorageWrapper";
import mmkvStorageWrapper from "LLM/storage/mmkvStorageWrapper";
import { STORAGE_TYPE } from "LLM/storage/constants";
import type { StorageState } from "LLM/storage/types";
import { migrator } from "../asyncStorageToMMKV";
import { MIGRATION_STATUS, MIGRATION_STATUS_KEY } from "../constants";
import { MigrationStatus } from "../types";

afterEach(() => jest.restoreAllMocks());
jest.mock("@ledgerhq/live-common/featureFlags/firebaseFeatureFlags", () => {
  const originalModule = jest.requireActual(
    "@ledgerhq/live-common/featureFlags/firebaseFeatureFlags",
  );

  // Mock the default export and named export 'foo'
  return {
    __esModule: true,
    ...originalModule,
    getFeature: jest.fn(() => ({ enabled: true })),
  };
});

describe("selectAsyncStorage", () => {
  it("should set the storage type to AsyncStorage", () => {
    // Arrange
    const state = {
      storageType: STORAGE_TYPE.MMKV,
      migrationStatus: MIGRATION_STATUS.NOT_STARTED,
    };

    // Act
    migrator.selectAsyncStorage(state);

    // Assert
    expect(state.storageType).toBe(STORAGE_TYPE.ASYNC_STORAGE);
  });
});

describe("selectMMKVStorage", () => {
  it("should set the storage type to MMKV", () => {
    // Arrange
    const state = {
      storageType: STORAGE_TYPE.ASYNC_STORAGE,
      migrationStatus: MIGRATION_STATUS.NOT_STARTED,
    };

    // Act
    migrator.selectMMKVStorage(state);

    // Assert
    expect(state.storageType).toBe(STORAGE_TYPE.MMKV);
  });
});

describe("setMigrationStatus", () => {
  const expected = {
    storageType: STORAGE_TYPE.ASYNC_STORAGE,
    migrationStatus: MIGRATION_STATUS.IN_PROGRESS,
  };
  let state: StorageState;
  let saveStringMethod: jest.SpyInstance;

  beforeEach(() => {
    // Arrange
    saveStringMethod = jest
      .spyOn(mmkvStorageWrapper, "saveString")
      .mockImplementation(() => undefined);
    state = {
      storageType: STORAGE_TYPE.ASYNC_STORAGE,
      migrationStatus: MIGRATION_STATUS.NOT_STARTED,
    };

    // Act
    migrator.setMigrationStatus(state, expected.migrationStatus);
  });

  it("should set the specified migration status to the referenced state", () => {
    expect(state).toEqual(expected);
  });

  it("should call the associated storage wrapper to save the migration status", () => {
    expect(saveStringMethod).toHaveBeenCalledWith(MIGRATION_STATUS_KEY, expected.migrationStatus);
  });
});

describe(`markMigrationStatusInProgress`, () => {
  it(`should call setMigrationStatus with in-progress`, () => {
    // Arrange
    const setMigrationStatusFn = jest
      .spyOn(migrator, "setMigrationStatus")
      .mockImplementation(() => undefined);
    const state = {
      storageType: STORAGE_TYPE.ASYNC_STORAGE,
      migrationStatus: MIGRATION_STATUS.NOT_STARTED,
    };

    // Act
    migrator.markMigrationStatusInProgress(state);

    // Assert
    expect(setMigrationStatusFn).toHaveBeenCalledWith(state, MIGRATION_STATUS.IN_PROGRESS);
  });
});

describe(`markMigrationStatusCompleted`, () => {
  it(`should call setMigrationStatus with completed`, () => {
    // Arrange
    const setMigrationStatusFn = jest
      .spyOn(migrator, "setMigrationStatus")
      .mockImplementation(() => undefined);
    const state = {
      storageType: STORAGE_TYPE.ASYNC_STORAGE,
      migrationStatus: MIGRATION_STATUS.NOT_STARTED,
    };

    // Act
    migrator.markMigrationStatusCompleted(state);

    // Assert
    expect(setMigrationStatusFn).toHaveBeenCalledWith(state, MIGRATION_STATUS.COMPLETED);
  });
});

describe("migrateData", () => {
  const getStringReturnValueMap: Record<string, string | null> = {
    key1: "value1",
    key2: null,
  };
  const keys = Object.keys(getStringReturnValueMap);
  let asKeyMethod: jest.SpyInstance;
  let asGetStringMethod: jest.SpyInstance;
  let mmkvSaveStringMethod: jest.SpyInstance;

  beforeEach(async () => {
    // Arrange
    asKeyMethod = jest
      .spyOn(asyncStorageWrapper, "keys")
      .mockImplementation(() => Promise.resolve(keys));
    asGetStringMethod = jest
      .spyOn(asyncStorageWrapper, "getString")
      .mockImplementation(key => Promise.resolve(getStringReturnValueMap[key]));
    mmkvSaveStringMethod = jest
      .spyOn(mmkvStorageWrapper, "saveString")
      .mockImplementation(() => undefined);

    // Act
    await migrator.migrateData();
  });

  it("should call asyncStorageWrapper.keys", () => {
    expect(asKeyMethod).toHaveBeenCalled();
  });

  keys.forEach((key, i) => {
    it(`should call asyncStorageWrapper.getString with ${key}`, () => {
      expect(asGetStringMethod).toHaveBeenNthCalledWith(i + 1, key);
    });
  });

  keys
    .filter(key => getStringReturnValueMap[key] !== null)
    .forEach((key, i) => {
      it(`should call mmkvStorageWrapper.saveString with ${key} and its related value`, () => {
        expect(mmkvSaveStringMethod).toHaveBeenNthCalledWith(
          i + 1,
          key,
          getStringReturnValueMap[key],
        );
      });
    });
});

describe("migrate", () => {
  let markMigrationStatusInProgressMethod: jest.SpyInstance;
  let markMigrationStatusCompletedMethod: jest.SpyInstance;
  let selectMMKVStorageMethod: jest.SpyInstance;

  beforeEach(async () => {
    // Arrange
    const state = {
      storageType: STORAGE_TYPE.ASYNC_STORAGE,
      migrationStatus: MIGRATION_STATUS.NOT_STARTED,
    };
    markMigrationStatusInProgressMethod = jest
      .spyOn(migrator, "markMigrationStatusInProgress")
      .mockImplementation(() => undefined);
    markMigrationStatusCompletedMethod = jest
      .spyOn(migrator, "markMigrationStatusCompleted")
      .mockImplementation(() => undefined);
    selectMMKVStorageMethod = jest
      .spyOn(migrator, "selectMMKVStorage")
      .mockImplementation(() => undefined);

    // Act
    await migrator.migrate(state);
  });

  it("should call migrator.markMigrationStatusInProgressMethod", () => {
    expect(markMigrationStatusInProgressMethod).toHaveBeenCalled();
  });

  it("should call migrator.markMigrationStatusCompleted", () => {
    expect(markMigrationStatusCompletedMethod).toHaveBeenCalled();
  });

  it("should call migrator.selectMMKVStorage", () => {
    expect(selectMMKVStorageMethod).toHaveBeenCalled();
  });
});

describe("handleMigration", () => {
  let selectAsyncStorageMethod: jest.SpyInstance;
  let migrateMethod: jest.SpyInstance;

  function setupTests(migrationStatus: MigrationStatus) {
    beforeEach(() => {
      // Arrange
      migrateMethod = jest
        .spyOn(migrator, "migrate")
        .mockImplementation(() => Promise.resolve(true));
      selectAsyncStorageMethod = jest
        .spyOn(migrator, "selectAsyncStorage")
        .mockImplementation(() => undefined);

      // Act
      migrator.handleMigration({
        storageType: STORAGE_TYPE.ASYNC_STORAGE,
        migrationStatus,
      });
    });
  }

  describe("when migration status is not-started", () => {
    setupTests(MIGRATION_STATUS.NOT_STARTED);

    it("should not call selectAsyncStorage", () => {
      expect(selectAsyncStorageMethod).not.toHaveBeenCalled();
    });

    it("should call migrate", () => {
      expect(migrateMethod).toHaveBeenCalled();
    });
  });

  describe("when migration status is in-progress", () => {
    setupTests(MIGRATION_STATUS.IN_PROGRESS);

    it("should not call selectAsyncStorage", () => {
      expect(selectAsyncStorageMethod).not.toHaveBeenCalled();
    });

    it("should call migrate", () => {
      expect(migrateMethod).toHaveBeenCalled();
    });
  });

  describe("when migration status is completed", () => {
    setupTests(MIGRATION_STATUS.COMPLETED);

    it("should not call selectAsyncStorage", () => {
      expect(selectAsyncStorageMethod).not.toHaveBeenCalled();
    });

    it("should not call migrate", () => {
      expect(migrateMethod).not.toHaveBeenCalled();
    });
  });

  describe("when migration status is rolled-back", () => {
    setupTests(MIGRATION_STATUS.ROLLED_BACK);

    it("should call selectAsyncStorage", () => {
      expect(selectAsyncStorageMethod).toHaveBeenCalled();
    });

    it("should not call migrate", () => {
      expect(migrateMethod).not.toHaveBeenCalled();
    });
  });
});

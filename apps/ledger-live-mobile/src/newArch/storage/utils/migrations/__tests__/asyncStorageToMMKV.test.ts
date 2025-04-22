import asyncStorageWrapper from "LLM/storage/asyncStorageWrapper";
import mmkvStorageWrapper from "LLM/storage/mmkvStorageWrapper";
import { STORAGE_TYPE } from "LLM/storage/constants";
import { migrator } from "../asyncStorageToMMKV";
import { MIGRATION_STATUS, ROLLBACK_STATUS } from "../constants";
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
    asKeyMethod = jest.spyOn(asyncStorageWrapper, "keys").mockResolvedValue(keys);
    asGetStringMethod = jest
      .spyOn(asyncStorageWrapper, "getString")
      .mockImplementation(key => Promise.resolve(getStringReturnValueMap[key]));
    mmkvSaveStringMethod = jest
      .spyOn(mmkvStorageWrapper, "saveString")
      .mockImplementation(() => undefined);

    await migrator.migrateData();
  });

  it("should call asyncStorageWrapper.keys", () => {
    expect(asKeyMethod).toHaveBeenCalled();
  });

  it.each(keys)("should call asyncStorageWrapper.getString for key %s", key => {
    expect(asGetStringMethod).toHaveBeenCalledWith(key);
  });

  it.each(keys.filter(key => getStringReturnValueMap[key] !== null))(
    "should call mmkvStorageWrapper.saveString for key %s with non-null value",
    key => {
      expect(mmkvSaveStringMethod).toHaveBeenCalledWith(key, getStringReturnValueMap[key]);
    },
  );
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
      rollbackStatus: ROLLBACK_STATUS.NOT_STARTED,
      numberOfReadErrors: 0,
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
      migrateMethod = jest.spyOn(migrator, "migrate").mockResolvedValue(true);
      selectAsyncStorageMethod = jest
        .spyOn(migrator, "selectAsyncStorage")
        .mockImplementation(() => undefined);

      // Act
      migrator.handleMigration({
        storageType: STORAGE_TYPE.ASYNC_STORAGE,
        migrationStatus,
        rollbackStatus: ROLLBACK_STATUS.NOT_STARTED,
        numberOfReadErrors: 0,
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

describe("rollbackToAsyncStorage", () => {
  let selectAsyncStorageMethod: jest.SpyInstance;
  let markRollbackStatusInProgressMethod: jest.SpyInstance;
  let markMigrationStatusRollbackedMethod: jest.SpyInstance;
  let markRollbackStatusCompletedMethod: jest.SpyInstance;

  beforeEach(async () => {
    // Arrange
    const state = {
      storageType: STORAGE_TYPE.MMKV,
      migrationStatus: MIGRATION_STATUS.IN_PROGRESS,
      rollbackStatus: ROLLBACK_STATUS.NOT_STARTED,
      numberOfReadErrors: 0,
    };

    selectAsyncStorageMethod = jest
      .spyOn(migrator, "selectAsyncStorage")
      .mockImplementation(() => undefined);
    markRollbackStatusInProgressMethod = jest
      .spyOn(migrator, "markRollbackStatusInProgress")
      .mockImplementation(() => undefined);
    markMigrationStatusRollbackedMethod = jest
      .spyOn(migrator, "markMigrationStatusRollbacked")
      .mockImplementation(() => undefined);
    markRollbackStatusCompletedMethod = jest
      .spyOn(migrator, "markRollbackStatusCompleted")
      .mockImplementation(() => undefined);

    // Act
    await migrator.rollbackToAsyncStorage(state);
  });

  it("should call selectAsyncStorage", () => {
    expect(selectAsyncStorageMethod).toHaveBeenCalled();
  });

  it("should call markRollbackStatusInProgress", () => {
    expect(markRollbackStatusInProgressMethod).toHaveBeenCalled();
  });

  it("should call markMigrationStatusRollbacked", () => {
    expect(markMigrationStatusRollbackedMethod).toHaveBeenCalled();
  });

  it("should call markRollbackStatusCompleted", () => {
    expect(markRollbackStatusCompletedMethod).toHaveBeenCalled();
  });
});

describe("resetMigration", () => {
  let deleteAllMethod: jest.SpyInstance;
  let markMigrationStatusNotStartedMethod: jest.SpyInstance;
  let markRollbackStatusNotStartedMethod: jest.SpyInstance;

  beforeEach(async () => {
    // Arrange
    deleteAllMethod = jest
      .spyOn(mmkvStorageWrapper, "deleteAll")
      .mockImplementation(() => Promise.resolve());
    markMigrationStatusNotStartedMethod = jest
      .spyOn(migrator, "markMigrationStatusNotStarted")
      .mockImplementation(() => undefined);
    markRollbackStatusNotStartedMethod = jest
      .spyOn(migrator, "markRollbackStatusNotStarted")
      .mockImplementation(() => undefined);

    // Act
    await migrator.resetMigration({
      storageType: STORAGE_TYPE.MMKV,
      migrationStatus: MIGRATION_STATUS.COMPLETED,
      rollbackStatus: ROLLBACK_STATUS.NOT_STARTED,
      numberOfReadErrors: 0,
    });
  });

  it("should call deleteAll #mmkvStorage.deleteAll", () => {
    expect(deleteAllMethod).toHaveBeenCalled();
  });

  it("should call markMigrationStatusNotStarted #markMigrationStatusNotStarted", () => {
    expect(markMigrationStatusNotStartedMethod).toHaveBeenCalled();
  });

  it("should call markRollbackStatusNotStarted #markRollbackStatusNotStarted", () => {
    expect(markRollbackStatusNotStartedMethod).toHaveBeenCalled();
  });
});

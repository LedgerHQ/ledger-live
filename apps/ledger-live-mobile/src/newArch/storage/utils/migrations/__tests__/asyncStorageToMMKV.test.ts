import asyncStorageWrapper from "LLM/storage/asyncStorageWrapper";
import mmkvStorageWrapper from "LLM/storage/mmkvStorageWrapper";
import { STORAGE_TYPE } from "LLM/storage/constants";
import type { StorageState } from "LLM/storage/types";
import { migrator } from "../asyncStorageToMMKV";
import { MIGRATION_STATUS, MIGRATION_STATUS_KEY } from "../constants";

afterEach(() => jest.restoreAllMocks());

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

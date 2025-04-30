import { createStorage, initStorageState } from "LLM/storage";
import { STORAGE_TYPE } from "../constants";
import type { StorageInitializer } from "../types";
import asyncStorageWrapper from "../asyncStorageWrapper";
import mmkvStorageWrapper from "../mmkvStorageWrapper";
import {
  MIGRATION_STATUS,
  MIGRATION_STATUS_KEY,
  ROLLBACK_STATUS,
} from "../utils/migrations/constants";

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

const error = new Error("Test error");

describe("storage", () => {
  let mockInitStorageState: jest.SpyInstance;

  function noop() {}
  function asyncNoop() {
    return Promise.resolve();
  }
  function createTestStorage() {
    return createStorage(mockInitStorageState as unknown as StorageInitializer);
  }

  describe("getState", () => {
    it("should return the state of the storage", () => {
      expect(createTestStorage().getState()).toEqual({
        storageType: STORAGE_TYPE.ASYNC_STORAGE,
        migrationStatus: MIGRATION_STATUS.NOT_STARTED,
        rollbackStatus: ROLLBACK_STATUS.NOT_STARTED,
        numberOfReadErrors: 0,
      });
    });
  });

  describe("keys", () => {
    let keysMethod: jest.SpyInstance;
    let result: Awaited<ReturnType<typeof asyncStorageWrapper.keys>>;
    const expectedValue = ["key1", "key2"];

    describe("with storage type MMKV", () => {
      beforeEach(async () => {
        // Arrange
        mockInitStorageState = jest.fn().mockImplementation(state => {
          state.storageType = STORAGE_TYPE.MMKV;
        });
        keysMethod = jest.spyOn(mmkvStorageWrapper, "keys").mockImplementation(() => expectedValue);
        const storage = createTestStorage();

        // Act
        result = await storage.keys();
      });

      it("should call mmkvStorageWrapper#keys once", () => {
        expect(keysMethod).toHaveBeenCalledTimes(1);
      });

      it("should return the value returned by mmkvStorageWrapper#keys", () => {
        expect(result).toEqual(expectedValue);
      });
    });

    describe("with storage type AsyncStorage", () => {
      beforeEach(async () => {
        // Arrange
        mockInitStorageState = jest.fn().mockImplementation(state => {
          state.storageType = STORAGE_TYPE.ASYNC_STORAGE;
        });
        keysMethod = jest
          .spyOn(asyncStorageWrapper, "keys")
          .mockImplementation(() => Promise.resolve(expectedValue));
        const storage = createTestStorage();

        // Act
        result = await storage.keys();
      });

      it("should call asyncStorageWrapper#keys once", () => {
        expect(keysMethod).toHaveBeenCalledTimes(1);
      });

      it("should return the value returned by asyncStorageWrapper#keys", () => {
        expect(result).toEqual(expectedValue);
      });
    });

    describe("handles error", () => {
      beforeEach(async () => {
        // Arrange
        mockInitStorageState = jest.fn().mockImplementation(state => {
          state.storageType = STORAGE_TYPE.ASYNC_STORAGE;
        });
        keysMethod = jest.spyOn(asyncStorageWrapper, "keys").mockImplementation(() => {
          throw error;
        });
        const storage = createTestStorage();

        await storage.save("key", { value: 1 });

        // Act
        try {
          result = await storage.keys();
        } catch (e) {
          result = e as string[];
        }
      });

      it("should call #get once", () => {
        expect(keysMethod).toHaveBeenCalledTimes(1);
      });

      it("should return the value returned by #get", () => {
        expect(result).toEqual(error);
      });

      it("should log the #save error", () => {
        expect(console.error).toHaveBeenCalledWith("Error getting keys from storage", {
          error: error,
          state: {
            migrationStatus: MIGRATION_STATUS.NOT_STARTED,
            numberOfReadErrors: 0,
            rollbackStatus: ROLLBACK_STATUS.NOT_STARTED,
            storageType: STORAGE_TYPE.ASYNC_STORAGE,
          },
        });
      });
    });
  });

  describe("get", () => {
    let getMethod: jest.SpyInstance;
    let result: Awaited<ReturnType<typeof asyncStorageWrapper.get>>;
    const expectedValue = { value: 1 };

    describe("with storage type MMKV", () => {
      beforeEach(async () => {
        // Arrange
        mockInitStorageState = jest.fn().mockImplementation(state => {
          state.storageType = STORAGE_TYPE.MMKV;
        });
        getMethod = jest
          .spyOn(mmkvStorageWrapper, "get")
          .mockImplementation(() => Promise.resolve(expectedValue));
        const storage = createTestStorage();

        // Act
        result = await storage.get("key");
      });

      it("should call mmkvStorageWrapper#get once", () => {
        expect(getMethod).toHaveBeenCalledTimes(1);
      });

      it("should return the value returned by mmkvStorageWrapper#get", () => {
        expect(result).toEqual(expectedValue);
      });
    });

    describe("with storage type AsyncStorage", () => {
      beforeEach(async () => {
        // Arrange
        mockInitStorageState = jest.fn().mockImplementation(state => {
          state.storageType = STORAGE_TYPE.ASYNC_STORAGE;
        });
        getMethod = jest
          .spyOn(asyncStorageWrapper, "get")
          .mockImplementation(() => Promise.resolve(expectedValue));
        const storage = createTestStorage();

        // Act
        result = await storage.get("key");
      });

      it("should call asyncStorageWrapper#get once", () => {
        expect(getMethod).toHaveBeenCalledTimes(1);
      });

      it("should return the value returned by asyncStorageWrapper#get", () => {
        expect(result).toEqual(expectedValue);
      });
    });

    describe("handles error", () => {
      beforeEach(async () => {
        // Arrange
        mockInitStorageState = jest.fn().mockImplementation(state => {
          state.storageType = STORAGE_TYPE.ASYNC_STORAGE;
        });
        getMethod = jest.spyOn(asyncStorageWrapper, "get").mockImplementation(() => {
          throw error;
        });
        const storage = createTestStorage();

        await storage.save("key", { value: 1 });

        // Act
        try {
          result = await storage.get("key");
        } catch (e) {
          result = e;
        }
      });

      it("should call #get once", () => {
        expect(getMethod).toHaveBeenCalledTimes(1);
      });

      it("should return the value returned by #get", () => {
        expect(result).toEqual(error);
      });

      it("should log the #save error", () => {
        expect(console.error).toHaveBeenCalledWith("Error getting key from storage", {
          error: error,
          state: {
            migrationStatus: MIGRATION_STATUS.NOT_STARTED,
            numberOfReadErrors: 0,
            rollbackStatus: ROLLBACK_STATUS.NOT_STARTED,
            storageType: STORAGE_TYPE.ASYNC_STORAGE,
          },
        });
      });
    });
  });

  describe("save", () => {
    let saveMethod: jest.SpyInstance;
    const args = ["key", { value: 1 }] as const;

    describe("with storage type MMKV", () => {
      beforeEach(async () => {
        // Arrange
        mockInitStorageState = jest.fn().mockImplementation(state => {
          state.storageType = STORAGE_TYPE.MMKV;
        });
        saveMethod = jest.spyOn(mmkvStorageWrapper, "save").mockImplementation(noop);
        const storage = createTestStorage();

        // Act
        await storage.save(...args);
      });

      it("should call mmkvStorageWrapper#save once", () => {
        expect(saveMethod).toHaveBeenCalledTimes(1);
      });

      it("should call mmkvStorageWrapper#save with corresponding arguments", () => {
        expect(saveMethod).toHaveBeenCalledWith(...args);
      });
    });

    describe("with storage type AsyncStorage", () => {
      beforeEach(async () => {
        // Arrange
        mockInitStorageState = jest.fn().mockImplementation(state => {
          state.storageType = STORAGE_TYPE.ASYNC_STORAGE;
        });
        saveMethod = jest.spyOn(asyncStorageWrapper, "save").mockImplementation(asyncNoop);
        const storage = createTestStorage();

        // Act
        await storage.save(...args);
      });

      it("should call asyncStorageWrapper#save once", () => {
        expect(saveMethod).toHaveBeenCalledTimes(1);
      });

      it("should call asyncStorageWrapper#save with corresponding arguments", () => {
        expect(saveMethod).toHaveBeenCalledWith(...args);
      });
    });

    describe("handles error", () => {
      let result: Awaited<ReturnType<Storage["save"]>>;
      beforeEach(async () => {
        // Arrange
        mockInitStorageState = jest.fn().mockImplementation(state => {
          state.storageType = STORAGE_TYPE.ASYNC_STORAGE;
        });
        saveMethod = jest.spyOn(asyncStorageWrapper, "save").mockImplementation(() => {
          throw error;
        });
        const storage = createTestStorage();

        // Act
        try {
          result = await storage.save("test", { value: 1 });
        } catch (e) {
          result = e;
        }
      });

      it("should call #save once", () => {
        expect(saveMethod).toHaveBeenCalledTimes(1);
      });

      it("should return the value returned by #save", () => {
        expect(result).toEqual(error);
      });

      it("should log the #save error", () => {
        expect(console.error).toHaveBeenCalledWith("Error saving key to storage", {
          error: error,
          state: {
            migrationStatus: MIGRATION_STATUS.NOT_STARTED,
            numberOfReadErrors: 0,
            rollbackStatus: ROLLBACK_STATUS.NOT_STARTED,
            storageType: STORAGE_TYPE.ASYNC_STORAGE,
          },
        });
      });
    });
  });

  describe("update", () => {
    let updateMethod: jest.SpyInstance;
    const args = ["key", { value: 1 }] as const;

    describe("with storage type MMKV", () => {
      beforeEach(async () => {
        // Arrange
        mockInitStorageState = jest.fn().mockImplementation(state => {
          state.storageType = STORAGE_TYPE.MMKV;
        });
        updateMethod = jest.spyOn(mmkvStorageWrapper, "update").mockImplementation(noop);
        const storage = createTestStorage();

        // Act
        await storage.update(...args);
      });

      it("should call mmkvStorageWrapper#get once", () => {
        expect(updateMethod).toHaveBeenCalledTimes(1);
      });

      it("should call mmkvStorageWrapper#save with corresponding arguments", () => {
        expect(updateMethod).toHaveBeenCalledWith(...args);
      });
    });

    describe("with storage type AsyncStorage", () => {
      beforeEach(async () => {
        // Arrange
        mockInitStorageState = jest.fn().mockImplementation(state => {
          state.storageType = STORAGE_TYPE.ASYNC_STORAGE;
        });
        updateMethod = jest.spyOn(asyncStorageWrapper, "update").mockImplementation(asyncNoop);
        const storage = createTestStorage();

        // Act
        await storage.update(...args);
      });

      it("should call asyncStorageWrapper#get once", () => {
        expect(updateMethod).toHaveBeenCalledTimes(1);
      });

      it("should call asyncStorageWrapper#save with corresponding arguments", () => {
        expect(updateMethod).toHaveBeenCalledWith(...args);
      });
    });

    describe("handles error", () => {
      let result: Awaited<ReturnType<Storage["update"]>>;
      beforeEach(async () => {
        // Arrange
        mockInitStorageState = jest.fn().mockImplementation(state => {
          state.storageType = STORAGE_TYPE.ASYNC_STORAGE;
        });
        updateMethod = jest.spyOn(asyncStorageWrapper, "update").mockImplementation(() => {
          throw error;
        });
        const storage = createTestStorage();

        await storage.save("key", { value: 1 });

        // Act
        try {
          result = await storage.update("key", { value: 2 });
        } catch (e) {
          result = e;
        }
      });

      it("should call #update once", () => {
        expect(updateMethod).toHaveBeenCalledTimes(1);
      });

      it("should return the value returned by #update", () => {
        expect(result).toEqual(error);
      });

      it("should log the #update error", () => {
        expect(console.error).toHaveBeenCalledWith("Error updating key in storage", {
          error: error,
          state: {
            migrationStatus: MIGRATION_STATUS.NOT_STARTED,
            numberOfReadErrors: 0,
            rollbackStatus: ROLLBACK_STATUS.NOT_STARTED,
            storageType: STORAGE_TYPE.ASYNC_STORAGE,
          },
        });
      });
    });
  });

  describe("delete", () => {
    let deleteMethod: jest.SpyInstance;
    const args = ["key"] as const;

    describe("with storage type MMKV", () => {
      beforeEach(async () => {
        // Arrange
        mockInitStorageState = jest.fn().mockImplementation(state => {
          state.storageType = STORAGE_TYPE.MMKV;
        });
        deleteMethod = jest.spyOn(mmkvStorageWrapper, "delete").mockImplementation(asyncNoop);
        const storage = createTestStorage();

        // Act
        await storage.delete(...args);
      });

      it("should call mmkvStorageWrapper#delete once", () => {
        expect(deleteMethod).toHaveBeenCalledTimes(1);
      });

      it("should call mmkvStorageWrapper#delete with corresponding arguments", () => {
        expect(deleteMethod).toHaveBeenCalledWith(...args);
      });
    });

    describe("with storage type AsyncStorage", () => {
      beforeEach(async () => {
        // Arrange
        mockInitStorageState = jest.fn().mockImplementation(state => {
          state.storageType = STORAGE_TYPE.ASYNC_STORAGE;
        });
        deleteMethod = jest.spyOn(asyncStorageWrapper, "delete").mockImplementation(asyncNoop);
        const storage = createTestStorage();

        // Act
        await storage.delete(...args);
      });

      it("should call asyncStorageWrapper#delete once", () => {
        expect(deleteMethod).toHaveBeenCalledTimes(1);
      });

      it("should call asyncStorageWrapper#delete with corresponding arguments", () => {
        expect(deleteMethod).toHaveBeenCalledWith(...args);
      });
    });

    describe("handles error", () => {
      let result: Awaited<ReturnType<Storage["delete"]>>;
      beforeEach(async () => {
        // Arrange
        mockInitStorageState = jest.fn().mockImplementation(state => {
          state.storageType = STORAGE_TYPE.ASYNC_STORAGE;
        });
        deleteMethod = jest.spyOn(asyncStorageWrapper, "delete").mockImplementation(() => {
          throw error;
        });
        const storage = createTestStorage();

        // Act
        try {
          result = await storage.delete("test");
        } catch (e) {
          result = e;
        }
      });

      it("should call #delete once", () => {
        expect(deleteMethod).toHaveBeenCalledTimes(1);
      });

      it("should return the value returned by #delete", () => {
        expect(result).toEqual(error);
      });

      it("should log the #delete error", () => {
        expect(console.error).toHaveBeenCalledWith("Error deleting key from storage", {
          error: error,
          state: {
            migrationStatus: MIGRATION_STATUS.NOT_STARTED,
            numberOfReadErrors: 0,
            rollbackStatus: ROLLBACK_STATUS.NOT_STARTED,
            storageType: STORAGE_TYPE.ASYNC_STORAGE,
          },
        });
      });
    });
  });

  describe("push", () => {
    let pushMethod: jest.SpyInstance;
    const args = ["key", 1] as const;

    describe("with storage type MMKV", () => {
      beforeEach(async () => {
        // Arrange
        mockInitStorageState = jest.fn().mockImplementation(state => {
          state.storageType = STORAGE_TYPE.MMKV;
        });
        pushMethod = jest.spyOn(mmkvStorageWrapper, "push").mockImplementation(asyncNoop);
        const storage = createTestStorage();

        // Act
        await storage.push(...args);
      });

      it("should call mmkvStorageWrapper#push once", () => {
        expect(pushMethod).toHaveBeenCalledTimes(1);
      });

      it("should call mmkvStorageWrapper#push with corresponding arguments", () => {
        expect(pushMethod).toHaveBeenCalledWith(...args);
      });
    });

    describe("with storage type AsyncStorage", () => {
      beforeEach(async () => {
        // Arrange
        mockInitStorageState = jest.fn().mockImplementation(state => {
          state.storageType = STORAGE_TYPE.ASYNC_STORAGE;
        });
        pushMethod = jest.spyOn(asyncStorageWrapper, "push").mockImplementation(asyncNoop);
        const storage = createTestStorage();

        // Act
        await storage.push(...args);
      });

      it("should call asyncStorageWrapper#push once", () => {
        expect(pushMethod).toHaveBeenCalledTimes(1);
      });

      it("should call asyncStorageWrapper#push with corresponding arguments", () => {
        expect(pushMethod).toHaveBeenCalledWith(...args);
      });
    });

    describe("handles error", () => {
      let result: Awaited<ReturnType<Storage["push"]>>;
      beforeEach(async () => {
        // Arrange
        mockInitStorageState = jest.fn().mockImplementation(state => {
          state.storageType = STORAGE_TYPE.ASYNC_STORAGE;
        });
        pushMethod = jest.spyOn(asyncStorageWrapper, "push").mockImplementation(() => {
          throw error;
        });
        const storage = createTestStorage();

        // Act
        try {
          result = await storage.push("test", 1);
        } catch (e) {
          result = e;
        }
      });

      it("should call #push once", () => {
        expect(pushMethod).toHaveBeenCalledTimes(1);
      });

      it("should return the value returned by #push", () => {
        expect(result).toEqual(error);
      });

      it("should log the #push error", () => {
        expect(console.error).toHaveBeenCalledWith("Error pushing value to storage", {
          error: error,
          state: {
            migrationStatus: MIGRATION_STATUS.NOT_STARTED,
            numberOfReadErrors: 0,
            rollbackStatus: ROLLBACK_STATUS.NOT_STARTED,
            storageType: STORAGE_TYPE.ASYNC_STORAGE,
          },
        });
      });
    });
  });

  describe("deleteAll", () => {
    let deleteAllMethod: jest.SpyInstance;

    describe("with storage type MMKV", () => {
      beforeEach(async () => {
        // Arrange
        mockInitStorageState = jest.fn().mockImplementation(state => {
          state.storageType = STORAGE_TYPE.MMKV;
        });
        deleteAllMethod = jest
          .spyOn(mmkvStorageWrapper, "deleteAll")
          .mockImplementation(() => Promise.resolve());
        const storage = createTestStorage();

        // Act
        await storage.deleteAll();
      });

      it("should call mmkvStorageWrapper#deleteAll once", () => {
        expect(deleteAllMethod).toHaveBeenCalledTimes(1);
      });
    });

    describe("with storage type AsyncStorage", () => {
      beforeEach(async () => {
        // Arrange
        mockInitStorageState = jest.fn().mockImplementation(state => {
          state.storageType = STORAGE_TYPE.ASYNC_STORAGE;
        });
        deleteAllMethod = jest
          .spyOn(asyncStorageWrapper, "deleteAll")
          .mockImplementation(() => Promise.resolve());
        const storage = createTestStorage();

        // Act
        await storage.deleteAll();
      });

      it("should call asyncStorageWrapper#deleteAll once", () => {
        expect(deleteAllMethod).toHaveBeenCalledTimes(1);
      });
    });

    describe("handles error", () => {
      let result: Awaited<ReturnType<Storage["deleteAll"]>>;
      beforeEach(async () => {
        // Arrange
        mockInitStorageState = jest.fn().mockImplementation(state => {
          state.storageType = STORAGE_TYPE.ASYNC_STORAGE;
        });
        deleteAllMethod = jest.spyOn(asyncStorageWrapper, "deleteAll").mockImplementation(() => {
          throw error;
        });
        const storage = createTestStorage();

        // Act
        try {
          result = await storage.deleteAll();
        } catch (e) {
          result = e;
        }
      });

      it("should call #deleteAllMethod once", () => {
        expect(deleteAllMethod).toHaveBeenCalledTimes(1);
      });

      it("should return the value returned by #deleteAllMethod", () => {
        expect(result).toEqual(error);
      });

      it("should log the #deleteAllMethod error", () => {
        expect(console.error).toHaveBeenCalledWith("Error deleting all keys from storage", {
          error: error,
          state: {
            migrationStatus: MIGRATION_STATUS.NOT_STARTED,
            numberOfReadErrors: 0,
            rollbackStatus: ROLLBACK_STATUS.NOT_STARTED,
            storageType: STORAGE_TYPE.ASYNC_STORAGE,
          },
        });
      });
    });
  });

  describe("stringify", () => {
    let stringifyMethod: jest.SpyInstance;
    let result: Awaited<ReturnType<Storage["stringify"]>>;
    const expectedValue = JSON.stringify({ key1: { a: 1 }, key2: { b: 2 } });

    describe("with storage type MMKV", () => {
      beforeEach(async () => {
        // Arrange
        mockInitStorageState = jest.fn().mockImplementation(state => {
          state.storageType = STORAGE_TYPE.MMKV;
        });
        stringifyMethod = jest
          .spyOn(mmkvStorageWrapper, "stringify")
          .mockImplementation(() => expectedValue);
        const storage = createTestStorage();

        // Act
        result = await storage.stringify();
      });

      it("should call mmkvStorageWrapper#keys once", () => {
        expect(stringifyMethod).toHaveBeenCalledTimes(1);
      });

      it("should return the value returned by mmkvStorageWrapper#keys", () => {
        expect(result).toEqual(expectedValue);
      });
    });

    describe("with storage type AsyncStorage", () => {
      beforeEach(async () => {
        // Arrange
        mockInitStorageState = jest.fn().mockImplementation(state => {
          state.storageType = STORAGE_TYPE.ASYNC_STORAGE;
        });
        stringifyMethod = jest
          .spyOn(asyncStorageWrapper, "stringify")
          .mockImplementation(() => Promise.resolve(expectedValue));
        const storage = createTestStorage();

        // Act
        result = await storage.stringify();
      });

      it("should call asyncStorageWrapper#keys once", () => {
        expect(stringifyMethod).toHaveBeenCalledTimes(1);
      });

      it("should return the value returned by asyncStorageWrapper#keys", () => {
        expect(result).toEqual(expectedValue);
      });
    });

    describe("handles error", () => {
      beforeEach(async () => {
        // Arrange
        mockInitStorageState = jest.fn().mockImplementation(state => {
          state.storageType = STORAGE_TYPE.ASYNC_STORAGE;
        });
        stringifyMethod = jest.spyOn(asyncStorageWrapper, "stringify").mockImplementation(() => {
          throw error;
        });
        const storage = createTestStorage();

        // Act
        try {
          result = await storage.stringify();
        } catch (e) {
          result = e;
        }
      });

      it("should call #stringify once", () => {
        expect(stringifyMethod).toHaveBeenCalledTimes(1);
      });

      it("should return the value returned by #stringify", () => {
        expect(result).toEqual(error);
      });

      it("should log the #stringify error", () => {
        expect(console.error).toHaveBeenCalledWith("Error stringifying storage", {
          error: error,
          state: {
            migrationStatus: MIGRATION_STATUS.NOT_STARTED,
            numberOfReadErrors: 0,
            rollbackStatus: ROLLBACK_STATUS.NOT_STARTED,
            storageType: STORAGE_TYPE.ASYNC_STORAGE,
          },
        });
      });
    });
  });

  describe("initStorageState", () => {
    beforeEach(() => {
      mockInitStorageState = jest.fn();
    });

    it("should set the storage type to MMKV if migration status is completed", () => {
      // Arrange
      mmkvStorageWrapper.getString = jest
        .fn()
        .mockImplementation(key =>
          key === MIGRATION_STATUS_KEY ? MIGRATION_STATUS.COMPLETED : null,
        );
      const state = {
        storageType: STORAGE_TYPE.ASYNC_STORAGE,
        migrationStatus: MIGRATION_STATUS.NOT_STARTED,
        rollbackStatus: ROLLBACK_STATUS.NOT_STARTED,
        numberOfReadErrors: 0,
      };

      // Act
      initStorageState(state);

      // Assert
      expect(state.storageType).toBe(STORAGE_TYPE.MMKV);
    });

    it("should set the storage type to AsyncStorage if migration status is not completed", () => {
      // Arrange
      mmkvStorageWrapper.getString = jest
        .fn()
        .mockImplementation(key =>
          key === MIGRATION_STATUS_KEY ? MIGRATION_STATUS.NOT_STARTED : null,
        );
      const state = {
        storageType: STORAGE_TYPE.ASYNC_STORAGE,
        migrationStatus: MIGRATION_STATUS.NOT_STARTED,
        rollbackStatus: ROLLBACK_STATUS.NOT_STARTED,
        numberOfReadErrors: 0,
      };

      // Act
      initStorageState(state);

      // Assert
      expect(state.storageType).toBe(STORAGE_TYPE.ASYNC_STORAGE);
    });

    it("should set the migration status to rolled back if rollback status is completed", () => {
      // Arrange
      mmkvStorageWrapper.getString = jest.fn().mockReturnValue(ROLLBACK_STATUS.COMPLETED);
      const state = {
        storageType: STORAGE_TYPE.ASYNC_STORAGE,
        migrationStatus: MIGRATION_STATUS.NOT_STARTED,
        rollbackStatus: ROLLBACK_STATUS.NOT_STARTED,
        numberOfReadErrors: 0,
      };

      // Act
      initStorageState(state);

      // Assert
      expect(state.migrationStatus).toBe(MIGRATION_STATUS.ROLLED_BACK);
    });
  });
});

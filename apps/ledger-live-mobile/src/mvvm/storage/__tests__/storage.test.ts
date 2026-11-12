import { track } from "@shared/analytics";
import { createStorage, initStorageState } from "LLM/storage";
import { STORAGE_TYPE } from "../constants";
import type { StorageInitializer, StorageState } from "../types";
import asyncStorageWrapper from "../asyncStorageWrapper";
import mmkvStorageWrapper from "../mmkvStorageWrapper";
import { MIGRATION_STATUS, MIGRATION_STATUS_KEY } from "../utils/migrations/constants";
import { migrator } from "../utils/migrations/asyncStorageToMMKV";

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
      mockInitStorageState = jest.fn();
      expect(createTestStorage().getState()).toEqual({
        storageType: STORAGE_TYPE.ASYNC_STORAGE,
        migrationStatus: MIGRATION_STATUS.NOT_STARTED,
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
            storageType: STORAGE_TYPE.ASYNC_STORAGE,
          },
        });
      });
    });

    describe("read errors with MMKV", () => {
      const readCount = 6;
      let lastSyntaxError: SyntaxError;
      let storage: ReturnType<typeof createTestStorage>;

      beforeEach(async () => {
        // Arrange
        mockInitStorageState = jest.fn().mockImplementation(state => {
          state.storageType = STORAGE_TYPE.MMKV;
        });
        jest.spyOn(mmkvStorageWrapper, "get").mockImplementation(() => {
          lastSyntaxError = new SyntaxError("Unexpected token");
          throw lastSyntaxError;
        });
        storage = createTestStorage();

        // Act
        for (let i = 0; i < readCount; i++) {
          await storage.get("key").catch(noop);
        }
      });

      it("should keep the MMKV storage type", () => {
        expect(storage.getState().storageType).toBe(STORAGE_TYPE.MMKV);
      });

      it("should count each read error", () => {
        expect(storage.getState().numberOfReadErrors).toBe(readCount);
      });

      it("should keep the stack trace of the last error", () => {
        expect(storage.getState().lastError?.stackTrace).toBe(lastSyntaxError.stack);
      });
    });
  });

  describe("getString", () => {
    describe("handles error", () => {
      let result: unknown;

      beforeEach(async () => {
        // Arrange
        mockInitStorageState = jest.fn().mockImplementation(state => {
          state.storageType = STORAGE_TYPE.ASYNC_STORAGE;
        });
        jest.spyOn(asyncStorageWrapper, "getString").mockImplementation(() => {
          throw error;
        });
        const storage = createTestStorage();

        // Act
        try {
          result = await storage.getString("key");
        } catch (e) {
          result = e;
        }
      });

      it("should reject with the error", () => {
        expect(result).toEqual(error);
      });

      it("should log the #getString error", () => {
        expect(console.error).toHaveBeenCalledWith("Error getting key from storage", {
          error: error,
          state: {
            migrationStatus: MIGRATION_STATUS.NOT_STARTED,
            numberOfReadErrors: 0,
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
            storageType: STORAGE_TYPE.ASYNC_STORAGE,
          },
        });
      });
    });
  });

  describe("initialization gate", () => {
    it("should wait for an asynchronous initializer before the first read", async () => {
      // Arrange
      let selectMMKV: () => void = noop;
      mockInitStorageState = jest.fn().mockImplementation(
        state =>
          new Promise<void>(resolve => {
            selectMMKV = () => {
              state.storageType = STORAGE_TYPE.MMKV;
              resolve();
            };
          }),
      );
      const mmkvGet = jest.spyOn(mmkvStorageWrapper, "get").mockImplementation(() => "mmkv");
      const asyncStorageGet = jest.spyOn(asyncStorageWrapper, "get");
      const storage = createTestStorage();

      // Act
      const result = storage.get("key");
      selectMMKV();

      // Assert
      await expect(result).resolves.toBe("mmkv");
      expect(mmkvGet).toHaveBeenCalledWith("key");
      expect(asyncStorageGet).not.toHaveBeenCalled();
    });

    it("should stay on AsyncStorage when the initializer rejects", async () => {
      // Arrange
      jest.spyOn(console, "warn").mockImplementation(noop);
      mockInitStorageState = jest.fn().mockRejectedValue(error);
      const asyncStorageGet = jest
        .spyOn(asyncStorageWrapper, "get")
        .mockImplementation(() => Promise.resolve("async"));
      const storage = createTestStorage();

      // Act
      const result = await storage.get("key");

      // Assert
      expect(result).toBe("async");
      expect(asyncStorageGet).toHaveBeenCalledWith("key");
    });
  });

  describe("handleMigration", () => {
    describe("handles error", () => {
      let result: unknown;

      beforeEach(async () => {
        // Arrange
        mockInitStorageState = jest.fn();
        jest.spyOn(migrator, "handleMigration").mockRejectedValue(error);
        const storage = createTestStorage();

        // Act
        try {
          result = await storage.handleMigration();
        } catch (e) {
          result = e;
        }
      });

      it("should reject with the error", () => {
        expect(result).toEqual(error);
      });

      it("should log the #handleMigration error", () => {
        expect(console.error).toHaveBeenCalledWith("Error handling migration", {
          error: error,
          state: {
            migrationStatus: MIGRATION_STATUS.NOT_STARTED,
            numberOfReadErrors: 0,
            storageType: STORAGE_TYPE.ASYNC_STORAGE,
          },
        });
      });
    });
  });

  describe("initStorageState", () => {
    let saveString: jest.SpyInstance;
    let asyncStorageKeys: jest.SpyInstance;
    let state: StorageState;

    function givenMigrationStatus(status: string | null) {
      jest
        .spyOn(mmkvStorageWrapper, "getString")
        .mockImplementation(key => (key === MIGRATION_STATUS_KEY ? status : null));
    }

    beforeEach(() => {
      saveString = jest.spyOn(mmkvStorageWrapper, "saveString").mockImplementation(noop);
      asyncStorageKeys = jest.spyOn(asyncStorageWrapper, "keys");
      jest.mocked(track).mockClear();
      state = {
        storageType: STORAGE_TYPE.ASYNC_STORAGE,
        migrationStatus: MIGRATION_STATUS.NOT_STARTED,
        numberOfReadErrors: 0,
      };
    });

    describe("on a new install", () => {
      beforeEach(async () => {
        givenMigrationStatus(null);
        asyncStorageKeys.mockResolvedValue([]);

        await initStorageState(state);
      });

      it("should select MMKV", () => {
        expect(state.storageType).toBe(STORAGE_TYPE.MMKV);
      });

      it("should mark the migration as completed", () => {
        expect(state.migrationStatus).toBe(MIGRATION_STATUS.COMPLETED);
        expect(saveString).toHaveBeenCalledWith(MIGRATION_STATUS_KEY, MIGRATION_STATUS.COMPLETED);
      });

      it("should not track a storage migration", () => {
        expect(track).not.toHaveBeenCalledWith("StorageMigration", expect.anything());
      });
    });

    describe("with AsyncStorage data and no migration status", () => {
      beforeEach(async () => {
        givenMigrationStatus(null);
        asyncStorageKeys.mockResolvedValue(["settings"]);

        await initStorageState(state);
      });

      it("should stay on AsyncStorage", () => {
        expect(state.storageType).toBe(STORAGE_TYPE.ASYNC_STORAGE);
        expect(state.migrationStatus).toBe(MIGRATION_STATUS.NOT_STARTED);
      });

      it("should not save to MMKV", () => {
        expect(saveString).not.toHaveBeenCalled();
      });
    });

    describe("with a completed migration", () => {
      beforeEach(async () => {
        givenMigrationStatus(MIGRATION_STATUS.COMPLETED);

        await initStorageState(state);
      });

      it("should select MMKV", () => {
        expect(state.storageType).toBe(STORAGE_TYPE.MMKV);
        expect(state.migrationStatus).toBe(MIGRATION_STATUS.COMPLETED);
      });

      it("should not read AsyncStorage keys", () => {
        expect(asyncStorageKeys).not.toHaveBeenCalled();
      });
    });

    describe("with a migration in progress", () => {
      beforeEach(async () => {
        givenMigrationStatus(MIGRATION_STATUS.IN_PROGRESS);
        asyncStorageKeys.mockResolvedValue([]);

        await initStorageState(state);
      });

      it("should stay on AsyncStorage", () => {
        expect(state.storageType).toBe(STORAGE_TYPE.ASYNC_STORAGE);
      });

      it("should not read AsyncStorage keys", () => {
        expect(asyncStorageKeys).not.toHaveBeenCalled();
      });
    });

    it("should reject and stay on AsyncStorage when AsyncStorage keys cannot be read", async () => {
      givenMigrationStatus(null);
      asyncStorageKeys.mockRejectedValue(error);

      await expect(initStorageState(state)).rejects.toBe(error);
      expect(state.storageType).toBe(STORAGE_TYPE.ASYNC_STORAGE);
      expect(saveString).not.toHaveBeenCalled();
    });
  });
});

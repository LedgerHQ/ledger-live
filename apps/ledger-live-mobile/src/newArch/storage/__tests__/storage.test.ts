import { createStorage } from "LLM/storage";
import { STORAGE_TYPE } from "../constants";
import type { StorageInitializer } from "../types";
import asyncStorageWrapper from "../asyncStorageWrapper";
import mmkvStorageWrapper from "../mmkvStorageWrapper";
import { MIGRATION_STATUS, ROLLBACK_STATUS } from "../utils/migrations/constants";

afterEach(() => jest.restoreAllMocks());

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
  });
});

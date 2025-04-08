import { createStorage } from "~/newArch/storage";
import { STORAGE_TYPE } from "../constants";

afterEach(() => jest.restoreAllMocks());

describe("storage", () => {
  describe("get", () => {
    describe("with storage type MMKV", () => {
      let mockInitStorageState: jest.SpyInstance;

      beforeEach(() => {
        // Arrange
        mockInitStorageState = jest
          .fn()
          .mockImplementation(state => (state.storageType = STORAGE_TYPE.MMKV));
      });
    });

    describe("with storage type AsyncStorage", () => {
      let mockInitStorageState: jest.SpyInstance;

      beforeEach(() => {
        // Arrange
        mockInitStorageState = jest
          .fn()
          .mockImplementation(state => (state.storageType = STORAGE_TYPE.ASYNC_STORAGE));
      });
    });
  });
});

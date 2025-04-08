import storage from "../asyncStorageWrapper";
import AsyncStorage from "@react-native-async-storage/async-storage";

afterEach(() => {
  jest.resetAllMocks();
});

describe("AsyncStorageWrapper", () => {
  describe("keys", () => {
    const returnedKeys = ["a", "b", "c"];
    let result: Awaited<ReturnType<typeof storage.keys>>;
    let method: jest.SpyInstance;

    beforeEach(async () => {
      // Arrange
      method = jest
        .spyOn(AsyncStorage, "getAllKeys")
        .mockImplementation(() => Promise.resolve(returnedKeys));

      // Act
      result = await storage.keys();
    });

    it("should call AsyncStorage#getAllKeys", async () => {
      expect(method).toHaveBeenCalledTimes(1);
    });

    it("should returns keys return by AsyncStorage#getAllKeys", async () => {
      expect(result).toEqual(returnedKeys);
    });
  });

  describe("get", () => {
    describe("with a single key", () => {
      const returnedValue = "value";
      let result: Awaited<ReturnType<typeof storage.get>>;
      let method: jest.SpyInstance;

      beforeEach(async () => {
        // Arrange
        method = jest
          .spyOn(AsyncStorage, "getItem")
          .mockImplementation(() => Promise.resolve(returnedValue));

        // Act
        result = await storage.get("key");
      });

      it("should call AsyncStorage#getItem", async () => {
        expect(method).toHaveBeenCalledTimes(1);
      });

      it("should returns value return by AsyncStorage#getItem", async () => {
        expect(result).toEqual(returnedValue);
      });
    });

    describe("with multiple keys", () => {
      const returnedValues = [
        ["key1", "value1"],
        ["key2", "value2"],
      ];
      let result: Awaited<ReturnType<typeof storage.get>>;
      let method: jest.SpyInstance;

      beforeEach(async () => {
        // Arrange
        method = jest
          .spyOn(AsyncStorage, "multiGet")
          .mockImplementation(() => Promise.resolve(returnedValues));

        // Act
        result = await storage.get(["key1", "key2"]);
      });

      it("should call AsyncStorage#multiGet", async () => {
        expect(method).toHaveBeenCalledTimes(1);
      });

      it("should returns values return by AsyncStorage#multiGet", async () => {
        expect(result).toEqual(["value1", "value2"]);
      });
    });
  });
});

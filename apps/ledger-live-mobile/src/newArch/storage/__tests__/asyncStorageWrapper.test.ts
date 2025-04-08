import storage from "../asyncStorageWrapper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { KeyValuePair } from "@react-native-async-storage/async-storage/lib/typescript/types";

afterEach(() => {
  jest.resetAllMocks();
});

describe("AsyncStorageWrapper", () => {
  let getAllKeysMethod: jest.SpyInstance;

  describe("keys", () => {
    const returnedKeys = ["a", "b", "c"];
    let result: Awaited<ReturnType<typeof storage.keys>>;

    beforeEach(async () => {
      // Arrange
      getAllKeysMethod = jest
        .spyOn(AsyncStorage, "getAllKeys")
        .mockImplementation(() => Promise.resolve(returnedKeys));

      // Act
      result = await storage.keys();
    });

    it("should call AsyncStorage#getAllKeys once", async () => {
      expect(getAllKeysMethod).toHaveBeenCalledTimes(1);
    });

    it("should returns keys return by AsyncStorage#getAllKeys", async () => {
      expect(result).toEqual(returnedKeys);
    });
  });

  describe("get", () => {
    describe("with a single key", () => {
      const returnedValue = `{"value": 1}`;
      let getItemMethod: jest.SpyInstance;
      let result: Awaited<ReturnType<typeof storage.get>>;

      beforeEach(async () => {
        // Arrange
        getItemMethod = jest
          .spyOn(AsyncStorage, "getItem")
          .mockImplementation(() => Promise.resolve(returnedValue));

        // Act
        result = await storage.get("key");
      });

      it("should call AsyncStorage#getItem once", async () => {
        expect(getItemMethod).toHaveBeenCalledTimes(1);
      });

      it("should returns value return by AsyncStorage#getItem", async () => {
        expect(result).toEqual(JSON.parse(returnedValue));
      });
    });

    describe("with multiple keys", () => {
      let multiGetMethod: jest.SpyInstance;

      const returnedValues = [
        ["key1", `{"a": 1}`],
        ["key2", `{"b": 2}`],
      ] as KeyValuePair[];
      let result: Awaited<ReturnType<typeof storage.get>>;

      beforeEach(async () => {
        // Arrange
        multiGetMethod = jest
          .spyOn(AsyncStorage, "multiGet")
          .mockImplementation(() => Promise.resolve(returnedValues));

        // Act
        result = await storage.get(["key1", "key2"]);
      });

      it("should call AsyncStorage#multiGet once", async () => {
        expect(multiGetMethod).toHaveBeenCalledTimes(1);
      });

      it("should returns values return by AsyncStorage#multiGet", async () => {
        expect(result).toEqual(returnedValues.map(([_, value]) => JSON.parse(value as string)));
      });
    });
  });

  describe("save", () => {
    let multiSetMethod: jest.SpyInstance;

    describe("with a single key", () => {
      beforeEach(async () => {
        // Arrange
        multiSetMethod = jest
          .spyOn(AsyncStorage, "multiSet")
          .mockImplementation(() => Promise.resolve());

        // Act
        await storage.save("key", { value: 1 });
      });

      it("should call AsyncStorage#setItem", async () => {
        expect(multiSetMethod).toHaveBeenCalledTimes(1);
      });

      it("should call AsyncStorage#setItem correct KeyValuePair", async () => {
        expect(multiSetMethod).toHaveBeenCalledWith([["key", `{"value":1}`]]);
      });
    });

    describe("with multiple keys", () => {
      const keyValuePairs: [string, { value: number }][] = [
        ["key1", { value: 1 }],
        ["key2", { value: 2 }],
      ];

      beforeEach(async () => {
        // Arrange
        multiSetMethod = jest
          .spyOn(AsyncStorage, "multiSet")
          .mockImplementation(() => Promise.resolve());

        // Act
        await storage.save(keyValuePairs);
      });

      it("should call AsyncStorage#setItem", async () => {
        expect(multiSetMethod).toHaveBeenCalledTimes(1);
      });

      it("should call AsyncStorage#setItem correct KeyValuePair", async () => {
        expect(multiSetMethod).toHaveBeenCalledWith(
          keyValuePairs.map(([k, v]) => [k, JSON.stringify(v)]),
        );
      });
    });
  });

  describe("update", () => {
    let getMethod: jest.SpyInstance;
    let saveMethod: jest.SpyInstance;
    const returnedValuesGet = { a: 1 };
    const updateValues = { b: 2 };

    beforeEach(async () => {
      // Arrange
      getMethod = jest
        .spyOn(storage, "get")
        .mockImplementation(() => Promise.resolve(returnedValuesGet));
      saveMethod = jest.spyOn(storage, "save").mockImplementation(() => Promise.resolve());

      // Act
      await storage.update("key", updateValues);
    });

    it("should call AsyncStorageWrapper#get", async () => {
      expect(getMethod).toHaveBeenCalledTimes(1);
    });

    it("should call AsyncStorageWrapper#get with the correct key", async () => {
      expect(getMethod).toHaveBeenCalledWith("key");
    });

    it("should call AsyncStorageWrapper#save", async () => {
      expect(saveMethod).toHaveBeenCalledTimes(1);
    });

    it("should call AsyncStorageWrapper#save with the correct pair where values are merged", async () => {
      expect(saveMethod).toHaveBeenCalledWith("key", { ...returnedValuesGet, ...updateValues });
    });
  });

  describe("delete", () => {
    let multiRemoveMethod: jest.SpyInstance;

    beforeEach(() => {
      jest
        .spyOn(AsyncStorage, "getAllKeys")
        .mockImplementation(() => Promise.resolve(["key1", "key2"]));
    });

    describe("with a single key", () => {
      const deleteKey = "key1";

      beforeEach(async () => {
        // Arrange
        multiRemoveMethod = jest
          .spyOn(AsyncStorage, "multiRemove")
          .mockImplementation(() => Promise.resolve());

        // Act
        await storage.delete(deleteKey);
      });

      it("should call AsyncStorage#multiRemove once", async () => {
        expect(multiRemoveMethod).toHaveBeenCalledTimes(1);
      });

      it("should call AsyncStorage#multiRemove with the correct KeyValuePair", async () => {
        expect(multiRemoveMethod).toHaveBeenCalledWith([deleteKey]);
      });
    });

    describe("with multiple keys", () => {
      const deleteKeys = ["key1", "key2"];

      beforeEach(async () => {
        // Arrange
        multiRemoveMethod = jest
          .spyOn(AsyncStorage, "multiRemove")
          .mockImplementation(() => Promise.resolve());

        // Act
        await storage.delete(deleteKeys);
      });

      it("should call AsyncStorage#multiRemove once", async () => {
        expect(multiRemoveMethod).toHaveBeenCalledTimes(1);
      });

      it("should call AsyncStorage#multiRemove with the correct KeyValuePair", async () => {
        expect(multiRemoveMethod).toHaveBeenCalledWith(deleteKeys);
      });
    });
  });

  describe("push", () => {
    let getMethod: jest.SpyInstance;
    let saveMethod: jest.SpyInstance;

    describe("when pushing value on non existing key", () => {
      const newValue = 1;

      beforeEach(async () => {
        // Arrange
        getMethod = jest.spyOn(storage, "get").mockImplementation(() => Promise.resolve(null));
        saveMethod = jest.spyOn(storage, "save").mockImplementation(() => Promise.resolve());

        // Act
        await storage.push("key", newValue);
      });

      it("should call AsyncStorage#save once", () => {
        expect(saveMethod).toHaveBeenCalledTimes(1);
      });

      it("should call AsyncStorage#save with the correct KeyValuePair", () => {
        expect(saveMethod).toHaveBeenCalledWith("key", [newValue]);
      });
    });

    describe("when pushing value on existing key containing an array", () => {
      const newValue = 2;
      const existingValues = [1];

      beforeEach(async () => {
        // Arrange
        getMethod = jest
          .spyOn(storage, "get")
          .mockImplementation(() => Promise.resolve(existingValues));
        saveMethod = jest.spyOn(storage, "save").mockImplementation(() => Promise.resolve());

        // Act
        await storage.push("key", newValue);
      });

      it("should call AsyncStorage#save once", () => {
        expect(saveMethod).toHaveBeenCalledTimes(1);
      });

      it("should call AsyncStorage#save with the correct KeyValuePair", () => {
        expect(saveMethod).toHaveBeenCalledWith("key", [...existingValues, newValue]);
      });
    });

    describe("when pushing value on existing key not containing an array", () => {
      const newValue = 2;
      let err: Error;

      beforeEach(async () => {
        // Arrange
        getMethod = jest.spyOn(storage, "get").mockImplementation(() => Promise.resolve(1));
        saveMethod = jest.spyOn(storage, "save").mockImplementation(() => Promise.resolve());

        // Act
        try {
          await storage.push("key", newValue);
        } catch (e) {
          err = e as Error;
        }
      });

      it("should not call AsyncStorage#save", () => {
        expect(saveMethod).not.toHaveBeenCalled();
      });

      it("should throw an error", () => {
        expect(err).toBeInstanceOf(Error);
      });
    });
  });
});

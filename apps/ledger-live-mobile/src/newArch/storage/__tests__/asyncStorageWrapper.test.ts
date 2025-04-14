import storage, { CHUNK_SIZE, CHUNKED_KEY } from "../asyncStorageWrapper";
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

    it("should call AsyncStorage#getAllKeys once", () => {
      expect(getAllKeysMethod).toHaveBeenCalledTimes(1);
    });

    it("should returns keys return by AsyncStorage#getAllKeys", () => {
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

      it("should call AsyncStorage#getItem once", () => {
        expect(getItemMethod).toHaveBeenCalledTimes(1);
      });

      it("should returns value return by AsyncStorage#getItem", () => {
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

      it("should call AsyncStorage#multiGet once", () => {
        expect(multiGetMethod).toHaveBeenCalledTimes(1);
      });

      it("should returns values return by AsyncStorage#multiGet", () => {
        expect(result).toEqual(returnedValues.map(([_, value]) => JSON.parse(value as string)));
      });
    });

    describe("with chunked key", () => {
      let expectedValue: string;
      let getItemMethod: jest.SpyInstance;
      let multiGetMethod: jest.SpyInstance;
      let result: Awaited<ReturnType<typeof storage.get>>;

      beforeEach(async () => {
        // Arrange
        const testKey = "key";
        const testItem = `{"a":1}`;
        const testLength = Math.ceil(CHUNK_SIZE / testItem.length);

        expectedValue = `[${Array(testLength).fill(testItem).join(",")}]`;

        const chunkListLenth = Math.ceil(expectedValue.length / CHUNK_SIZE);
        const multiGetResults: KeyValuePair[] = [];

        for (let i = 0; i < chunkListLenth; i++) {
          multiGetResults.push([
            `${testKey}${CHUNKED_KEY}${i}`,
            expectedValue.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
          ]);
        }

        getItemMethod = jest
          .spyOn(AsyncStorage, "getItem")
          .mockImplementation(() => Promise.resolve(`${CHUNKED_KEY}${chunkListLenth}`));
        multiGetMethod = jest
          .spyOn(AsyncStorage, "multiGet")
          .mockImplementation(() => Promise.resolve(multiGetResults));

        // Act
        result = await storage.get("key");
      });

      it("should call AsyncStorage#getItem once", () => {
        expect(getItemMethod).toHaveBeenCalledTimes(1);
      });

      it("should call AsyncStorage#multiGet once", () => {
        expect(multiGetMethod).toHaveBeenCalledTimes(1);
      });

      it("should returns valid JSON string", () => {
        expect(result).toEqual(JSON.parse(expectedValue));
      });
    });
  });

  describe("getString", () => {
    describe("with a single key", () => {
      const returnedValue = `{"value": 1}`;
      let getItemMethod: jest.SpyInstance;
      let result: Awaited<ReturnType<typeof storage.getString>>;

      beforeEach(async () => {
        // Arrange
        getItemMethod = jest
          .spyOn(AsyncStorage, "getItem")
          .mockImplementation(() => Promise.resolve(returnedValue));

        // Act
        result = await storage.getString("key");
      });

      it("should call AsyncStorage#getItem once", () => {
        expect(getItemMethod).toHaveBeenCalledTimes(1);
      });

      it("should returns value return by AsyncStorage#getItem", () => {
        expect(result).toEqual(returnedValue);
      });
    });

    describe("with chunked key", () => {
      let expectedValue: string;
      let getItemMethod: jest.SpyInstance;
      let multiGetMethod: jest.SpyInstance;
      let result: Awaited<ReturnType<typeof storage.getString>>;

      beforeEach(async () => {
        // Arrange
        const testKey = "key";
        const testLength = CHUNK_SIZE + 1;
        const chunkListLength = Math.ceil(testLength / CHUNK_SIZE);
        const multiGetResults: KeyValuePair[] = [];

        expectedValue = Array(testLength).fill("a").join("");

        for (let i = 0; i < chunkListLength; i++) {
          multiGetResults.push([
            `${testKey}${CHUNKED_KEY}${i}`,
            expectedValue.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
          ]);
        }

        getItemMethod = jest
          .spyOn(AsyncStorage, "getItem")
          .mockImplementation(() => Promise.resolve(`${CHUNKED_KEY}${chunkListLength}`));
        multiGetMethod = jest
          .spyOn(AsyncStorage, "multiGet")
          .mockImplementation(() => Promise.resolve(multiGetResults));

        // Act
        result = await storage.getString("key");
      });

      it("should call AsyncStorage#getItem once", () => {
        expect(getItemMethod).toHaveBeenCalledTimes(1);
      });

      it("should call AsyncStorage#multiGet once", () => {
        expect(multiGetMethod).toHaveBeenCalledTimes(1);
      });

      it("should returns the concatenated string", () => {
        expect(result).toEqual(expectedValue);
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

      it("should call AsyncStorage#setItem", () => {
        expect(multiSetMethod).toHaveBeenCalledTimes(1);
      });

      it("should call AsyncStorage#setItem correct KeyValuePair", () => {
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

      it("should call AsyncStorage#setItem", () => {
        expect(multiSetMethod).toHaveBeenCalledTimes(1);
      });

      it("should call AsyncStorage#setItem correct KeyValuePair", () => {
        expect(multiSetMethod).toHaveBeenCalledWith(
          keyValuePairs.map(([k, v]) => [k, JSON.stringify(v)]),
        );
      });
    });

    describe("with chunkable value", () => {
      let multiSetMethod: jest.SpyInstance;
      let multiSetArg: KeyValuePair[];

      beforeEach(async () => {
        // Arrange
        const testKey = "key";
        const testItem = `{"a":1}`;
        const testLength = Math.ceil(CHUNK_SIZE / testItem.length);
        const chunkableValue = `[${Array(testLength).fill(testItem).join(",")}]`;
        const chunkListLenth = Math.ceil(chunkableValue.length / CHUNK_SIZE);

        multiSetArg = [[testKey, `${CHUNKED_KEY}${chunkListLenth}`]];

        for (let i = 0; i < chunkListLenth; i++) {
          multiSetArg.push([
            `${testKey}${CHUNKED_KEY}${i}`,
            chunkableValue.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
          ]);
        }

        multiSetMethod = jest
          .spyOn(AsyncStorage, "multiSet")
          .mockImplementation(() => Promise.resolve());

        // Act
        await storage.save(testKey, JSON.parse(chunkableValue));
      });

      it("should call AsyncStorageWrapper#multiSet once", () => {
        expect(multiSetMethod).toHaveBeenCalledTimes(1);
      });

      it("should call AsyncStorageWrapper#multiSet with the correct pairs", () => {
        expect(multiSetMethod).toHaveBeenCalledWith(multiSetArg);
      });
    });
  });

  describe("saveString", () => {
    let multiSet: jest.SpyInstance;

    describe("with a single key", () => {
      beforeEach(() => {
        // Arrange
        multiSet = jest.spyOn(AsyncStorage, "multiSet").mockImplementation(() => Promise.resolve());

        // Act
        storage.saveString("key", "stringToSave");
      });

      it("should call AsyncStorageWrapper#multiSet", () => {
        expect(multiSet).toHaveBeenCalledTimes(1);
      });

      it("should call AsyncStorageWrapper#multiSet with the correct pair", () => {
        expect(multiSet).toHaveBeenCalledWith([["key", "stringToSave"]]);
      });
    });

    describe("with chunkable value", () => {
      let multiSetMethod: jest.SpyInstance;
      let multiSetArg: KeyValuePair[];

      beforeEach(async () => {
        // Arrange
        const testKey = "key";
        const testLength = CHUNK_SIZE + 1;
        const chunksLength = Math.ceil(testLength / CHUNK_SIZE);
        const chunkableValue = Array(testLength).fill("a").join("");

        multiSetArg = [[testKey, `${CHUNKED_KEY}${chunksLength}`]];
        for (let i = 0; i < chunksLength; i++) {
          multiSetArg.push([
            `${testKey}${CHUNKED_KEY}${i}`,
            chunkableValue.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
          ]);
        }

        multiSetMethod = jest
          .spyOn(AsyncStorage, "multiSet")
          .mockImplementation(() => Promise.resolve());

        // Act
        await storage.saveString(testKey, chunkableValue);
      });

      it("should call AsyncStorageWrapper#multiSet once", () => {
        expect(multiSetMethod).toHaveBeenCalledTimes(1);
      });

      it("should call AsyncStorageWrapper#multiSet with the correct pairs", () => {
        expect(multiSetMethod).toHaveBeenCalledWith(multiSetArg);
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

    it("should call AsyncStorageWrapper#get", () => {
      expect(getMethod).toHaveBeenCalledTimes(1);
    });

    it("should call AsyncStorageWrapper#get with the correct key", () => {
      expect(getMethod).toHaveBeenCalledWith("key");
    });

    it("should call AsyncStorageWrapper#save", () => {
      expect(saveMethod).toHaveBeenCalledTimes(1);
    });

    it("should call AsyncStorageWrapper#save with the correct pair where values are merged", () => {
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

      it("should call AsyncStorage#multiRemove once", () => {
        expect(multiRemoveMethod).toHaveBeenCalledTimes(1);
      });

      it("should call AsyncStorage#multiRemove with the correct KeyValuePair", () => {
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

      it("should call AsyncStorage#multiRemove once", () => {
        expect(multiRemoveMethod).toHaveBeenCalledTimes(1);
      });

      it("should call AsyncStorage#multiRemove with the correct KeyValuePair", () => {
        expect(multiRemoveMethod).toHaveBeenCalledWith(deleteKeys);
      });
    });
  });

  describe("deleteAll", () => {
    let multiRemoveMethod: jest.SpyInstance;

    beforeEach(async () => {
      // Arrange
      multiRemoveMethod = jest
        .spyOn(AsyncStorage, "multiRemove")
        .mockImplementation(() => Promise.resolve());

      jest
        .spyOn(AsyncStorage, "getAllKeys")
        .mockImplementation(() => Promise.resolve(["key1", "key2", "key3"]));

      // Act
      await storage.deleteAll();
    });

    it("should call AsyncStorage#getAllKeys once", () => {
      expect(AsyncStorage.getAllKeys).toHaveBeenCalledTimes(1);
    });

    it("should call AsyncStorage#multiRemove once", () => {
      expect(multiRemoveMethod).toHaveBeenCalledTimes(1);
    });

    it("should call AsyncStorage#multiRemove with all keys", () => {
      expect(multiRemoveMethod).toHaveBeenCalledWith(["key1", "key2", "key3"]);
    });
  });

  describe("push", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

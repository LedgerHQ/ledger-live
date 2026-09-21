import storage, { CHUNK_SIZE, CHUNKED_KEY } from "../asyncStorageWrapper";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
      let getManyMethod: jest.SpyInstance;

      const returnedValues: Record<string, string | null> = {
        key1: `{"a": 1}`,
        key2: `{"b": 2}`,
      };
      let result: Awaited<ReturnType<typeof storage.get>>;

      beforeEach(async () => {
        // Arrange
        getManyMethod = jest
          .spyOn(AsyncStorage, "getMany")
          .mockImplementation(() => Promise.resolve(returnedValues));

        // Act
        result = await storage.get(["key1", "key2"]);
      });

      it("should call AsyncStorage#getMany once", () => {
        expect(getManyMethod).toHaveBeenCalledTimes(1);
      });

      it("should returns values return by AsyncStorage#getMany", () => {
        expect(result).toEqual(
          Object.values(returnedValues).map(value => JSON.parse(value as string)),
        );
      });
    });

    describe("with chunked key", () => {
      let expectedValue: string;
      let getItemMethod: jest.SpyInstance;
      let getManyMethod: jest.SpyInstance;
      let result: Awaited<ReturnType<typeof storage.get>>;

      beforeEach(async () => {
        // Arrange
        const testKey = "key";
        const testItem = `{"a":1}`;
        const testLength = Math.ceil(CHUNK_SIZE / testItem.length);

        expectedValue = `[${Array(testLength).fill(testItem).join(",")}]`;

        const chunkListLenth = Math.ceil(expectedValue.length / CHUNK_SIZE);
        const getManyResults: Record<string, string | null> = {};

        for (let i = 0; i < chunkListLenth; i++) {
          getManyResults[`${testKey}${CHUNKED_KEY}${i}`] = expectedValue.slice(
            i * CHUNK_SIZE,
            (i + 1) * CHUNK_SIZE,
          );
        }

        getItemMethod = jest
          .spyOn(AsyncStorage, "getItem")
          .mockImplementation(() => Promise.resolve(`${CHUNKED_KEY}${chunkListLenth}`));
        getManyMethod = jest
          .spyOn(AsyncStorage, "getMany")
          .mockImplementation(() => Promise.resolve(getManyResults));

        // Act
        result = await storage.get("key");
      });

      it("should call AsyncStorage#getItem once", () => {
        expect(getItemMethod).toHaveBeenCalledTimes(1);
      });

      it("should call AsyncStorage#getMany once", () => {
        expect(getManyMethod).toHaveBeenCalledTimes(1);
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
      let getManyMethod: jest.SpyInstance;
      let result: Awaited<ReturnType<typeof storage.getString>>;

      beforeEach(async () => {
        // Arrange
        const testKey = "key";
        const testLength = CHUNK_SIZE + 1;
        const chunkListLength = Math.ceil(testLength / CHUNK_SIZE);
        const getManyResults: Record<string, string | null> = {};

        expectedValue = Array(testLength).fill("a").join("");

        for (let i = 0; i < chunkListLength; i++) {
          getManyResults[`${testKey}${CHUNKED_KEY}${i}`] = expectedValue.slice(
            i * CHUNK_SIZE,
            (i + 1) * CHUNK_SIZE,
          );
        }

        getItemMethod = jest
          .spyOn(AsyncStorage, "getItem")
          .mockImplementation(() => Promise.resolve(`${CHUNKED_KEY}${chunkListLength}`));
        getManyMethod = jest
          .spyOn(AsyncStorage, "getMany")
          .mockImplementation(() => Promise.resolve(getManyResults));

        // Act
        result = await storage.getString("key");
      });

      it("should call AsyncStorage#getItem once", () => {
        expect(getItemMethod).toHaveBeenCalledTimes(1);
      });

      it("should call AsyncStorage#getMany once", () => {
        expect(getManyMethod).toHaveBeenCalledTimes(1);
      });

      it("should returns the concatenated string", () => {
        expect(result).toEqual(expectedValue);
      });
    });
  });

  describe("save", () => {
    let setManyMethod: jest.SpyInstance;

    describe("with a single key", () => {
      beforeEach(async () => {
        // Arrange
        setManyMethod = jest
          .spyOn(AsyncStorage, "setMany")
          .mockImplementation(() => Promise.resolve());

        // Act
        await storage.save("key", { value: 1 });
      });

      it("should call AsyncStorage#setMany", () => {
        expect(setManyMethod).toHaveBeenCalledTimes(1);
      });

      it("should call AsyncStorage#setMany with the correct entries", () => {
        expect(setManyMethod).toHaveBeenCalledWith({ key: `{"value":1}` });
      });
    });

    describe("with multiple keys", () => {
      const keyValuePairs: [string, { value: number }][] = [
        ["key1", { value: 1 }],
        ["key2", { value: 2 }],
      ];

      beforeEach(async () => {
        // Arrange
        setManyMethod = jest
          .spyOn(AsyncStorage, "setMany")
          .mockImplementation(() => Promise.resolve());

        // Act
        await storage.save(keyValuePairs);
      });

      it("should call AsyncStorage#setMany", () => {
        expect(setManyMethod).toHaveBeenCalledTimes(1);
      });

      it("should call AsyncStorage#setMany with the correct entries", () => {
        expect(setManyMethod).toHaveBeenCalledWith(
          Object.fromEntries(keyValuePairs.map(([k, v]) => [k, JSON.stringify(v)])),
        );
      });
    });

    describe("with chunkable value", () => {
      let setManyMethod: jest.SpyInstance;
      let setManyArg: Record<string, string>;

      beforeEach(async () => {
        // Arrange
        const testKey = "key";
        const testItem = `{"a":1}`;
        const testLength = Math.ceil(CHUNK_SIZE / testItem.length);
        const chunkableValue = `[${Array(testLength).fill(testItem).join(",")}]`;
        const chunkListLenth = Math.ceil(chunkableValue.length / CHUNK_SIZE);

        setManyArg = { [testKey]: `${CHUNKED_KEY}${chunkListLenth}` };

        for (let i = 0; i < chunkListLenth; i++) {
          setManyArg[`${testKey}${CHUNKED_KEY}${i}`] = chunkableValue.slice(
            i * CHUNK_SIZE,
            (i + 1) * CHUNK_SIZE,
          );
        }

        setManyMethod = jest
          .spyOn(AsyncStorage, "setMany")
          .mockImplementation(() => Promise.resolve());

        // Act
        await storage.save(testKey, JSON.parse(chunkableValue));
      });

      it("should call AsyncStorageWrapper#setMany once", () => {
        expect(setManyMethod).toHaveBeenCalledTimes(1);
      });

      it("should call AsyncStorageWrapper#setMany with the correct entries", () => {
        expect(setManyMethod).toHaveBeenCalledWith(setManyArg);
      });
    });
  });

  describe("saveString", () => {
    let setMany: jest.SpyInstance;

    describe("with a single key", () => {
      beforeEach(() => {
        // Arrange
        setMany = jest.spyOn(AsyncStorage, "setMany").mockImplementation(() => Promise.resolve());

        // Act
        storage.saveString("key", "stringToSave");
      });

      it("should call AsyncStorageWrapper#setMany", () => {
        expect(setMany).toHaveBeenCalledTimes(1);
      });

      it("should call AsyncStorageWrapper#setMany with the correct entry", () => {
        expect(setMany).toHaveBeenCalledWith({ key: "stringToSave" });
      });
    });

    describe("with chunkable value", () => {
      let setManyMethod: jest.SpyInstance;
      let setManyArg: Record<string, string>;

      beforeEach(async () => {
        // Arrange
        const testKey = "key";
        const testLength = CHUNK_SIZE + 1;
        const chunksLength = Math.ceil(testLength / CHUNK_SIZE);
        const chunkableValue = Array(testLength).fill("a").join("");

        setManyArg = { [testKey]: `${CHUNKED_KEY}${chunksLength}` };
        for (let i = 0; i < chunksLength; i++) {
          setManyArg[`${testKey}${CHUNKED_KEY}${i}`] = chunkableValue.slice(
            i * CHUNK_SIZE,
            (i + 1) * CHUNK_SIZE,
          );
        }

        setManyMethod = jest
          .spyOn(AsyncStorage, "setMany")
          .mockImplementation(() => Promise.resolve());

        // Act
        await storage.saveString(testKey, chunkableValue);
      });

      it("should call AsyncStorageWrapper#setMany once", () => {
        expect(setManyMethod).toHaveBeenCalledTimes(1);
      });

      it("should call AsyncStorageWrapper#setMany with the correct entries", () => {
        expect(setManyMethod).toHaveBeenCalledWith(setManyArg);
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
    let removeManyMethod: jest.SpyInstance;

    beforeEach(() => {
      jest
        .spyOn(AsyncStorage, "getAllKeys")
        .mockImplementation(() => Promise.resolve(["key1", "key2"]));
    });

    describe("with a single key", () => {
      const deleteKey = "key1";

      beforeEach(async () => {
        // Arrange
        removeManyMethod = jest
          .spyOn(AsyncStorage, "removeMany")
          .mockImplementation(() => Promise.resolve());

        // Act
        await storage.delete(deleteKey);
      });

      it("should call AsyncStorage#removeMany once", () => {
        expect(removeManyMethod).toHaveBeenCalledTimes(1);
      });

      it("should call AsyncStorage#removeMany with the correct keys", () => {
        expect(removeManyMethod).toHaveBeenCalledWith([deleteKey]);
      });
    });

    describe("with multiple keys", () => {
      const deleteKeys = ["key1", "key2"];

      beforeEach(async () => {
        // Arrange
        removeManyMethod = jest
          .spyOn(AsyncStorage, "removeMany")
          .mockImplementation(() => Promise.resolve());

        // Act
        await storage.delete(deleteKeys);
      });

      it("should call AsyncStorage#removeMany once", () => {
        expect(removeManyMethod).toHaveBeenCalledTimes(1);
      });

      it("should call AsyncStorage#removeMany with the correct keys", () => {
        expect(removeManyMethod).toHaveBeenCalledWith(deleteKeys);
      });
    });
  });

  describe("deleteAll", () => {
    let removeManyMethod: jest.SpyInstance;

    beforeEach(async () => {
      // Arrange
      removeManyMethod = jest
        .spyOn(AsyncStorage, "removeMany")
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

    it("should call AsyncStorage#removeMany once", () => {
      expect(removeManyMethod).toHaveBeenCalledTimes(1);
    });

    it("should call AsyncStorage#removeMany with all keys", () => {
      expect(removeManyMethod).toHaveBeenCalledWith(["key1", "key2", "key3"]);
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

describe("stringify", () => {
  const testKeys = ["key1", "key2"];
  const getManyResults: Record<string, string | null> = {
    key1: `{"a": 1}`,
    key2: `{"b": 1}`,
  };

  let keysMethod: jest.SpyInstance;
  let getManyMethod: jest.SpyInstance;
  let result: Awaited<ReturnType<typeof storage.stringify>>;

  beforeEach(async () => {
    // Arrange

    keysMethod = jest.spyOn(storage, "keys").mockImplementation(() => Promise.resolve(testKeys));
    getManyMethod = jest
      .spyOn(AsyncStorage, "getMany")
      .mockImplementation(() => Promise.resolve(getManyResults));

    // Act
    result = await storage.stringify();
  });

  it("should call AsyncStorage#keys once", () => {
    expect(keysMethod).toHaveBeenCalledTimes(1);
  });

  it("should call AsyncStorage#getMany once", () => {
    expect(getManyMethod).toHaveBeenCalledTimes(1);
  });

  it("should call AsyncStorage#getMany with correponding keys", () => {
    expect(getManyMethod).toHaveBeenCalledWith(testKeys);
  });

  it("should returns the storage content as a JSON string", () => {
    expect(result).toBe(JSON.stringify(getManyResults));
  });
});

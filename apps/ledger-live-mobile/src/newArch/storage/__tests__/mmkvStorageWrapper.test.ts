import storage from "../mmkvStorageWrapper";
import { MMKV } from "react-native-mmkv";

afterEach(() => {
  jest.resetAllMocks();
});

describe("MMKVStorageWrapper", () => {
  const noop = () => {};
  let getAllKeysMethod: jest.SpyInstance;

  describe("keys", () => {
    const returnedKeys = ["a", "b", "c"];
    let result: Awaited<ReturnType<typeof storage.keys>>;

    beforeEach(() => {
      // Arrange
      getAllKeysMethod = jest
        .spyOn(MMKV.prototype, "getAllKeys")
        .mockImplementation(() => returnedKeys);

      // Act
      result = storage.keys();
    });

    it("should call MMKV#getAllKeys once", () => {
      expect(getAllKeysMethod).toHaveBeenCalledTimes(1);
    });

    it("should returns keys return by MMKV#getAllKeys", () => {
      expect(result).toEqual(returnedKeys);
    });
  });

  describe("get", () => {
    describe("with a single key", () => {
      const returnedValue = `{"value": 1}`;
      let getStringMethod: jest.SpyInstance;
      let result: Awaited<ReturnType<typeof storage.get>>;

      beforeEach(() => {
        // Arrange
        getStringMethod = jest
          .spyOn(MMKV.prototype, "getString")
          .mockImplementation(() => returnedValue);

        // Act
        result = storage.get("key");
      });

      it("should call MMKV#getString once", () => {
        expect(getStringMethod).toHaveBeenCalledTimes(1);
      });

      it("should returns the value returned by MMKV#getString", () => {
        expect(result).toEqual(JSON.parse(returnedValue));
      });
    });

    describe("with multiple keys", () => {
      const returnedValues: Record<string, string> = {
        key1: `{"a": 1}`,
        key2: `{"b": 2}`,
      };

      let multiGetMethod: jest.SpyInstance;
      let result: Awaited<ReturnType<typeof storage.get>>;

      beforeEach(() => {
        // Arrange
        multiGetMethod = jest
          .spyOn(MMKV.prototype, "getString")
          .mockImplementation(key => returnedValues[key]);

        // Act
        result = storage.get(["key1", "key2"]);
      });

      it("should call MMKV#getString as many times as there are keys", () => {
        expect(multiGetMethod).toHaveBeenCalledTimes(Object.keys(returnedValues).length);
      });

      it("should returns values return by MMKV#getString", () => {
        expect(result).toEqual(Object.values(returnedValues).map(x => JSON.parse(x)));
      });
    });
  });

  describe("save", () => {
    let setMethod: jest.SpyInstance;

    describe("with a single key", () => {
      beforeEach(() => {
        // Arrange
        setMethod = jest.spyOn(MMKV.prototype, "set").mockImplementation(noop);

        // Act
        storage.save("key", { value: 1 });
      });

      it("should call MMKV#set", () => {
        expect(setMethod).toHaveBeenCalledTimes(1);
      });

      it("should call MMKV#set with the correct pair", () => {
        expect(setMethod).toHaveBeenCalledWith("key", `{"value":1}`);
      });
    });

    describe("with multiple keys", () => {
      const keyValuePairs: [string, { value: number }][] = [
        ["key1", { value: 1 }],
        ["key2", { value: 2 }],
      ];

      beforeEach(() => {
        // Arrange
        setMethod = jest.spyOn(MMKV.prototype, "set").mockImplementation(() => Promise.resolve());

        // Act
        storage.save(keyValuePairs);
      });

      it("should call MMKV#set as many times as there are keys", () => {
        expect(setMethod).toHaveBeenCalledTimes(2);
      });

      for (let i = 0; i < keyValuePairs.length; i++) {
        const nth = i + 1;
        it(`[${nth}] should call MMKV#set correct pair`, () => {
          const [k, v] = keyValuePairs[i];
          expect(setMethod).toHaveBeenNthCalledWith(nth, k, JSON.stringify(v));
        });
      }
    });
  });

  describe("update", () => {
    let getMethod: jest.SpyInstance;
    let saveMethod: jest.SpyInstance;
    const returnedValuesGet = { a: 1 };
    const updateValues = { b: 2 };

    beforeEach(() => {
      // Arrange
      getMethod = jest.spyOn(storage, "get").mockImplementation(() => returnedValuesGet);
      saveMethod = jest.spyOn(storage, "save").mockImplementation(noop);

      // Act
      storage.update("key", updateValues);
    });

    it("should call MMKVStorageWrapper#get", () => {
      expect(getMethod).toHaveBeenCalledTimes(1);
    });

    it("should call MMKVStorageWrapper#get with the correct key", () => {
      expect(getMethod).toHaveBeenCalledWith("key");
    });

    it("should call MMKVStorageWrapper#save", () => {
      expect(saveMethod).toHaveBeenCalledTimes(1);
    });

    it("should call MMKVStorageWrapper#save with the correct pair where values are merged", () => {
      expect(saveMethod).toHaveBeenCalledWith("key", { ...returnedValuesGet, ...updateValues });
    });
  });

  describe("delete", () => {
    let deleteMethod: jest.SpyInstance;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let containsMethod: jest.SpyInstance;

    describe("with a single key", () => {
      const deleteKey = "key1";

      beforeEach(() => {
        // Arrange
        containsMethod = jest.spyOn(MMKV.prototype, "contains").mockImplementation(() => true);
        deleteMethod = jest.spyOn(MMKV.prototype, "delete").mockImplementation(noop);

        // Act
        storage.delete(deleteKey);
      });

      it("should call MMKV#delete once", () => {
        expect(deleteMethod).toHaveBeenCalledTimes(1);
      });

      it("should call MMKV#delete with the correct key", () => {
        expect(deleteMethod).toHaveBeenCalledWith(deleteKey);
      });
    });

    describe("with multiple keys", () => {
      const deleteKeys = ["key1", "key2"];

      beforeEach(() => {
        // Arrange
        containsMethod = jest.spyOn(MMKV.prototype, "contains").mockImplementation(() => true);
        deleteMethod = jest.spyOn(MMKV.prototype, "delete").mockImplementation(noop);

        // Act
        storage.delete(deleteKeys);
      });

      it("should call MMKV#delete as many times as there are keys", () => {
        expect(deleteMethod).toHaveBeenCalledTimes(2);
      });

      for (let i = 0; i < deleteKeys.length; i++) {
        const nth = i + 1;
        it(`[${nth}] should call MMKV#delete for correct key`, () => {
          const k = deleteKeys[i];
          expect(deleteMethod).toHaveBeenNthCalledWith(nth, k);
        });
      }
    });
  });
});

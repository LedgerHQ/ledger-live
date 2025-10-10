import { createMMKVCacheAdapter } from "../implementations/mmkv.native";
import { runCacheAdapterTests } from "./test-helpers";

describe("MMKV Cache Adapter", () => {
  let mockMMKV: any;
  let mockStorage: Map<string, string>;

  beforeEach(() => {
    mockStorage = new Map();
    mockMMKV = {
      getString: jest.fn((key: string) => mockStorage.get(key)),
      set: jest.fn((key: string, value: string) => mockStorage.set(key, value)),
      delete: jest.fn((key: string) => mockStorage.delete(key)),
      clearAll: jest.fn(() => mockStorage.clear()),
      getAllKeys: jest.fn(() => Array.from(mockStorage.keys())),
    };
  });

  // Run standard cache adapter tests
  runCacheAdapterTests({
    name: "MMKV",
    createAdapter: config => createMMKVCacheAdapter(mockMMKV, config, "test-prefix:"),
  });
});

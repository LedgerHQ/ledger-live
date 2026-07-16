type StoredValue = string | number | boolean;

const createInstance = () => {
  const store = new Map<string, StoredValue>();
  return {
    getString: jest.fn((key: string): string | undefined => {
      const v = store.get(key);
      return typeof v === "string" ? v : undefined;
    }),
    getNumber: jest.fn((key: string): number | undefined => {
      const v = store.get(key);
      return typeof v === "number" ? v : undefined;
    }),
    getBoolean: jest.fn((key: string): boolean | undefined => {
      const v = store.get(key);
      return typeof v === "boolean" ? v : undefined;
    }),
    set: jest.fn((key: string, value: StoredValue) => {
      store.set(key, value);
    }),
    remove: jest.fn((key: string) => store.delete(key)),
    contains: jest.fn((key: string) => store.has(key)),
    getAllKeys: jest.fn(() => Array.from(store.keys())),
    clearAll: jest.fn(() => store.clear()),
    get size() {
      return store.size;
    },
  };
};

export const createMMKV = jest.fn((_config?: Record<string, unknown>) => createInstance());
export type MMKV = ReturnType<typeof createInstance>;

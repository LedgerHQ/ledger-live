const store: Record<string, string | number | boolean> = {};

const instance = {
  getString: jest.fn((key: string) => store[key] as string | undefined),
  getNumber: jest.fn((key: string) => store[key] as number | undefined),
  getBoolean: jest.fn((key: string) => store[key] as boolean | undefined),
  set: jest.fn((key: string, value: string | number | boolean) => {
    store[key] = value;
  }),
  remove: jest.fn((key: string) => {
    delete store[key];
  }),
  contains: jest.fn((key: string) => key in store),
  getAllKeys: jest.fn(() => Object.keys(store)),
  clearAll: jest.fn(() => {
    for (const key of Object.keys(store)) delete store[key];
  }),
  size: 0,
};

export const createMMKV = jest.fn(() => instance);
export type MMKV = typeof instance;

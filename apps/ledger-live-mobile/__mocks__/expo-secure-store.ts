// expo-secure-store ships its entry as ESM TypeScript source (src/index.ts) via its react-native
// export condition, and that source reaches for the native expo-modules-core EventEmitter. Jest can
// parse neither. Stub it with an in-memory store so suites that pull it in transitively — anything
// building the real store, which injects @features/platform-card into cardApiExtra — behave like a
// device with an empty keychain, without a per-test jest.mock.
const slots = new Map<string, string>();

export const AFTER_FIRST_UNLOCK = "after-first-unlock";

export const getItemAsync = jest.fn(async (key: string) => slots.get(key) ?? null);

export const setItemAsync = jest.fn(async (key: string, value: string) => {
  slots.set(key, value);
});

export const deleteItemAsync = jest.fn(async (key: string) => {
  slots.delete(key);
});

export const isAvailableAsync = jest.fn(() => Promise.resolve(true));

// expo-keep-awake ships its entry as ESM TypeScript source (src/index.ts) via
// its react-native export condition, which Jest cannot parse and does not need.
// Stub the native wake-lock API so suites pulling it in transitively (e.g. the
// Device Intent Executor flow) run without a per-test jest.mock.
export const activateKeepAwakeAsync = jest.fn(() => Promise.resolve());
export const deactivateKeepAwake = jest.fn(() => Promise.resolve());
export const activateKeepAwake = jest.fn(() => Promise.resolve());
export const isAvailableAsync = jest.fn(() => Promise.resolve(true));
export const useKeepAwake = jest.fn();

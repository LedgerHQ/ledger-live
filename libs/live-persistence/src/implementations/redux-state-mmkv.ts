/**
 * Simple MMKV persistence for Redux state
 * Mobile uses its own storage abstraction, so this is just a reference implementation
 */

import type { PersistedRtkQueryState } from "../rtk-redux-persist";

const STORAGE_KEY = "crypto-assets-cache";

/**
 * Create MMKV-backed Redux state persistence
 * @param mmkvInstance - MMKV instance from react-native-mmkv
 */
export function createMMKVReduxStatePersistence(mmkvInstance: {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
}) {
  return {
    async load(): Promise<PersistedRtkQueryState | null> {
      try {
        const json = mmkvInstance.getString(STORAGE_KEY);
        if (!json) return null;
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        return JSON.parse(json) as PersistedRtkQueryState;
      } catch {
        return null;
      }
    },

    async save(state: PersistedRtkQueryState | null): Promise<void> {
      if (!state) return;
      try {
        mmkvInstance.set(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Silent fail
      }
    },

    async clear(): Promise<void> {
      try {
        mmkvInstance.delete(STORAGE_KEY);
      } catch {
        // Silent fail
      }
    },
  };
}

import { jsonConfigStorage, type ConfigStorage, type StorageKey } from "@shared/app-config";

export const appConfigStorage: ConfigStorage = jsonConfigStorage(
  localStorageKey("appConfigSelections"),
);

function localStorageKey(key: string): StorageKey {
  return {
    get: () => localStorage.getItem(key),
    set: (value: string) => localStorage.setItem(key, value),
    remove: () => localStorage.removeItem(key),
  };
}

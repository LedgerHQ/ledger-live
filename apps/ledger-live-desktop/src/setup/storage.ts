import { jsonConfigStorage, type AppConfigStorage, type StorageKey } from "@shared/app-config";

export const appConfigStorage: AppConfigStorage = {
  selections: jsonConfigStorage(localStorageKey("appConfigSelections")),
  devValues: jsonConfigStorage(localStorageKey("appConfigDevValues")),
};

function localStorageKey(key: string): StorageKey {
  return {
    get: () => localStorage.getItem(key),
    set: (value: string) => localStorage.setItem(key, value),
    remove: () => localStorage.removeItem(key),
  };
}

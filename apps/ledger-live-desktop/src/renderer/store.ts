import ElectronStore from "electron-store";
import isEmpty from "lodash/isEmpty";

const store = new ElectronStore({
  name: "lld",
  encryptionKey: "this_only_obfuscates",
});

export function getStoreValue<T>(key: string, storeId: string): T | undefined {
  const value = store.get(`${storeId}-${key}`);
  return isEmpty(value) ? undefined : (value as T);
}

export function setStoreValue<T>(key: string, value: T, storeId: string) {
  return store.set(`${storeId}-${key}`, value);
}

export function resetStore() {
  return store.clear();
}

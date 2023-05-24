import ElectronStore from "electron-store";
import isEmpty from "lodash/isEmpty";

const store = new ElectronStore({
  name: "lld",
  encryptionKey: "this_only_obfuscates",
});

export const getStoreValue = (key: string, storeId: string) => {
  const value = store.get(`${storeId}-${key}`);
  return isEmpty(value) ? null : value;
};

export const setStoreValue = (key: string, value: unknown, storeId: string) => {
  return store.set(`${storeId}-${key}`, value);
};

export const resetStore = () => {
  return store.clear();
};

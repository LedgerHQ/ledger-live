import store from "~/logic/storeWrapper";
import isEmpty from "lodash/isEmpty";

export function getStoreValue<T>(key: string, storeId: string): T | undefined {
  const value = store.get(`${storeId}-${key}`);
  return isEmpty(value) ? undefined : (value as T);
}

export function setStoreValue<T>(key: string, value: T, storeId: string) {
  return store.update(`${storeId}-${key}`, value);
}

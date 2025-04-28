import storage from "LLM/storage";
import isEmpty from "lodash/isEmpty";

export function getStoreValue<T>(key: string, storeId: string): T | undefined {
  const value = storage.get(`${storeId}-${key}`);
  return isEmpty(value) ? undefined : (value as T);
}

export function setStoreValue<T>(key: string, value: T, storeId: string) {
  return storage.update(`${storeId}-${key}`, value);
}

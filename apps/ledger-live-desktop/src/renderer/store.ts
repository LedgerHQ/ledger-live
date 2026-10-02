import cloneDeep from "lodash/cloneDeep";
import get from "lodash/get";
import isEmpty from "lodash/isEmpty";
import set from "lodash/set";
import { bootstrap, store as storeBridge } from "~/renderer/bridge";

// Synchronous on purpose: the Recover funnel reads it on first render.
let cache: Record<string, unknown> = cloneDeep(bootstrap.store);

const storeKey = (key: string, storeId: string) => `${storeId}-${key}`;
const storePath = (key: string, storeId: string) => storeKey(key, storeId).split(".");

export function getStoreValue<T>(key: string, storeId: string): T | undefined {
  const value = get(cache, storePath(key, storeId));
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return isEmpty(value) ? undefined : (value as T);
}

export function setStoreValue<T>(key: string, value: T, storeId: string) {
  set(cache, storePath(key, storeId), value);
  storeBridge.set(storeKey(key, storeId), value);
}

export function resetStore() {
  cache = {};
  storeBridge.clear();
}

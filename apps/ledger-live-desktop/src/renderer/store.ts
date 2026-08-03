import { ipcRenderer } from "electron";
import cloneDeep from "lodash/cloneDeep";
import get from "lodash/get";
import isEmpty from "lodash/isEmpty";
import set from "lodash/set";
import { CHANNELS } from "~/bridge/contract";
import { bootstrap } from "~/renderer/bridge";

// In-memory copy of main's `lld.json`: reads stay synchronous for the Recover funnel.
let cache: Record<string, unknown> = cloneDeep(bootstrap.store);

const storeKey = (key: string, storeId: string) => `${storeId}-${key}`;
const storePath = (key: string, storeId: string) => storeKey(key, storeId).split(".");

export function getStoreValue<T>(key: string, storeId: string): T | undefined {
  const value = get(cache, storePath(key, storeId));
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return isEmpty(value) ? undefined : (value as T);
}

export function setStoreValue<T>(key: string, value: T, storeId: string) {
  // Local copy first: useRecoverBannerState reads these writes back.
  set(cache, storePath(key, storeId), value);
  ipcRenderer.send(CHANNELS.storeSet, storeKey(key, storeId), value);
}

export function resetStore() {
  cache = {};
  ipcRenderer.send(CHANNELS.storeClear);
}

import { ipcRenderer } from "electron";
import isEmpty from "lodash/isEmpty";
import { CHANNELS } from "~/bridge/contract";
import { bootstrap } from "~/renderer/bridge";

/**
 * Renderer view of the `lld.json` store.
 *
 * The store itself lives in the main process; this module keeps an in-memory copy,
 * hydrated once from the bootstrap snapshot, and writes through asynchronously.
 *
 * Reads stay synchronous on purpose. Making them async would only touch five call sites,
 * but four of them are in the Recover onboarding funnel and would become `useState` plus
 * an effect — introducing a first-render `undefined` that changes banner visibility and
 * redirect behaviour. That is a product-behaviour risk not worth taking to satisfy an
 * infrastructure migration.
 *
 * The copy is point-in-time: an out-of-band write to `lld.json` by main would not be seen
 * here. Nothing does that today.
 */
const cache = new Map<string, unknown>(Object.entries(bootstrap.store));

const storeKey = (key: string, storeId: string) => `${storeId}-${key}`;

export function getStoreValue<T>(key: string, storeId: string): T | undefined {
  const value = cache.get(storeKey(key, storeId));
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return isEmpty(value) ? undefined : (value as T);
}

export function setStoreValue<T>(key: string, value: T, storeId: string) {
  // Update the local copy first: read-your-writes is load-bearing, because
  // RecoverSubscriptionStateSection writes values that useRecoverBannerState reads back.
  cache.set(storeKey(key, storeId), value);
  ipcRenderer.send(CHANNELS.storeSet, storeKey(key, storeId), value);
}

export function resetStore() {
  cache.clear();
  ipcRenderer.send(CHANNELS.storeClear);
}

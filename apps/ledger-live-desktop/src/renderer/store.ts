import isEmpty from "lodash/isEmpty";
import { bootstrap, store as storeBridge } from "~/renderer/bridge";

/**
 * Renderer view of the `lld.json` store, which lives in main. Hydrated once from the
 * bootstrap snapshot and written through asynchronously.
 *
 * Reads stay synchronous on purpose: four of the five call sites are in the Recover
 * onboarding funnel, where a first-render `undefined` would change banner visibility and
 * redirect behaviour.
 *
 * The copy is point-in-time. Nothing writes `lld.json` out of band today.
 */
const cache = new Map<string, unknown>(Object.entries(bootstrap.store));

const storeKey = (key: string, storeId: string) => `${storeId}-${key}`;

export function getStoreValue<T>(key: string, storeId: string): T | undefined {
  const value = cache.get(storeKey(key, storeId));
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return isEmpty(value) ? undefined : (value as T);
}

export function setStoreValue<T>(key: string, value: T, storeId: string) {
  // Read-your-writes is load-bearing: RecoverSubscriptionStateSection writes values that
  // useRecoverBannerState reads straight back.
  cache.set(storeKey(key, storeId), value);
  storeBridge.set(storeKey(key, storeId), value);
}

export function resetStore() {
  cache.clear();
  storeBridge.clear();
}

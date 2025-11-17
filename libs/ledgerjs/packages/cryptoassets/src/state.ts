import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import type { Store } from "@reduxjs/toolkit";
import type { StateWithCryptoAssets } from "./cal-client/persistence";

/**
 * Global CryptoAssetsStore instance.
 * This is the single source of truth for the cryptoassets store.
 * All modules should use this store directly.
 */
let globalCryptoAssetsStore: CryptoAssetsStore | undefined = undefined;

/**
 * Global Redux store instance (for accessing RTK Query state).
 * This is set when setupCalClientStore() is called.
 */
let globalReduxStore: Store<StateWithCryptoAssets> | undefined = undefined;

/**
 * Sets the global CryptoAssetsStore instance.
 * This should be called once during application initialization.
 */
export function setCryptoAssetsStore(store: CryptoAssetsStore): void {
  globalCryptoAssetsStore = store;
}

/**
 * Gets the global CryptoAssetsStore instance.
 * @throws {Error} If the store has not been set yet.
 */
export function getCryptoAssetsStore(): CryptoAssetsStore {
  if (!globalCryptoAssetsStore) {
    throw new Error("CryptoAssetsStore is not set. Please call setCryptoAssetsStore first.");
  }
  return globalCryptoAssetsStore;
}

/**
 * Sets the global Redux store instance.
 * This should be called when setting up the CAL client store.
 * @internal
 */
export function setReduxStore(store: Store<StateWithCryptoAssets>): void {
  globalReduxStore = store;
}

/**
 * Gets the global Redux store instance.
 * This allows access to the RTK Query state for persistence operations.
 * @throws {Error} If the store has not been set yet.
 */
export function getReduxStore(): Store<StateWithCryptoAssets> {
  if (!globalReduxStore) {
    throw new Error("Redux store is not set. Please call setupCalClientStore first.");
  }
  return globalReduxStore;
}

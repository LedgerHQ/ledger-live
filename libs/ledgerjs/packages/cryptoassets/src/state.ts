import type { CryptoAssetsStore } from "@ledgerhq/types-live";

/**
 * Global CryptoAssetsStore instance.
 * This is the single source of truth for the cryptoassets store.
 * All modules should use this store directly.
 */
let globalCryptoAssetsStore: CryptoAssetsStore | undefined = undefined;

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

import type { CryptoAssetsStore } from "@ledgerhq/types-live";

declare global {
  interface GlobalThis {
    __ledgerCryptoAssetsStore?: CryptoAssetsStore;
  }
}

/**
 * Sets the global CryptoAssetsStore instance.
 * This should be called once during application initialization.
 *
 * Uses globalThis to ensure a single shared reference across all module instances,
 * which is critical when coin-modules are lazy-loaded and may resolve to separate
 * module copies.
 */
export function setCryptoAssetsStore(store: CryptoAssetsStore): void {
  globalThis.__ledgerCryptoAssetsStore = store;
}

/**
 * Gets the global CryptoAssetsStore instance.
 * @throws {Error} If the store has not been set yet.
 */
export function getCryptoAssetsStore(): CryptoAssetsStore {
  if (!globalThis.__ledgerCryptoAssetsStore) {
    throw new Error("CryptoAssetsStore is not set. Please call setCryptoAssetsStore first.");
  }
  return globalThis.__ledgerCryptoAssetsStore;
}

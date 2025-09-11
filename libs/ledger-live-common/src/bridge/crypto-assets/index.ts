import type { CryptoAssetsStore } from "@ledgerhq/types-live";

let cryptoAssetsStore: CryptoAssetsStore | undefined = undefined;

export function setCryptoAssetsStore(store: CryptoAssetsStore) {
  cryptoAssetsStore = store;
}

export function getCryptoAssetsStore(): CryptoAssetsStore {
  if (!cryptoAssetsStore) {
    throw new Error("CryptoAssetsStore is not set. Please call setCryptoAssetsStore first.");
  }

  return cryptoAssetsStore;
}

import type { CryptoAssetsStore, CryptoAssetsStoreGetter } from "@ledgerhq/types-live";

export const CRYPTO_ASSETS_STORE_NO_SET_ERROR_MESSAGE =
  "CryptoAssetsStore is not set. Please call setCryptoAssetsStoreGetter first on coin EVM";

let getStore: CryptoAssetsStoreGetter;
export function setCryptoAssetsStoreGetter(cryptoAssetsStoreGetter: CryptoAssetsStoreGetter): void {
  getStore = cryptoAssetsStoreGetter;
}

export function getCryptoAssetsStore(): CryptoAssetsStore {
  if (!getStore) {
    throw new Error(CRYPTO_ASSETS_STORE_NO_SET_ERROR_MESSAGE);
  }
  return getStore();
}

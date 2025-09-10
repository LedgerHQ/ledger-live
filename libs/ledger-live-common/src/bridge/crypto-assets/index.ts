import * as legacy from "@ledgerhq/cryptoassets/tokens";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import { isCALIntegrationEnabled, getCALStore } from "./cal-integration";

const legacyStore: CryptoAssetsStore = {
  findTokenByAddress: legacy.findTokenByAddress,
  getTokenById: legacy.getTokenById,
  findTokenById: legacy.findTokenById,
  findTokenByAddressInCurrency: legacy.findTokenByAddressInCurrency,
  findTokenByTicker: legacy.findTokenByTicker,
};

let cryptoAssetsStore: CryptoAssetsStore | undefined = undefined;

export function setCryptoAssetsStore(store: CryptoAssetsStore) {
  cryptoAssetsStore = store;
}

export function getCryptoAssetsStore(): CryptoAssetsStore {
  if (isCALIntegrationEnabled()) {
    return getCALStore();
  }
  if (cryptoAssetsStore) {
    return cryptoAssetsStore;
  }
  // Fallback to legacy static store
  return legacyStore;
}

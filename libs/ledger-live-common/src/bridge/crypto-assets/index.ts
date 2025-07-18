import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { CryptoAssetsStore } from "./type";
import * as legacy from "@ledgerhq/cryptoassets/tokens";

let cryptoAssetsStoreRef: CryptoAssetsStore | undefined = undefined;

export function setCryptoAssetsStore(store: CryptoAssetsStore) {
  cryptoAssetsStoreRef = store;
}

const legacyStore: CryptoAssetsStore = {
  findTokenByAddress: legacy.findTokenByAddress,
  getTokenById: legacy.getTokenById,
  findTokenById: legacy.findTokenById,
  findTokenByAddressInCurrency: legacy.findTokenByAddressInCurrency,
  findTokenByTicker: legacy.findTokenByTicker,
};

export function getCryptoAssetsStore(): CryptoAssetsStore | undefined {
  const featureEnabled = LiveConfig.getValueByKey("feature_cal_lazy_loading");
  if (!featureEnabled) {
    return legacyStore;
  }

  if (!cryptoAssetsStoreRef) {
    throw new Error("CryptoAssetsStore is not set. Please call setCryptoAssetsStore first.");
  }

  return cryptoAssetsStoreRef;
}

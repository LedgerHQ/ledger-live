import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { CryptoAssetsStore } from "@ledgerhq/coin-framework/crypto-assets/type";
import * as legacy from "@ledgerhq/cryptoassets/tokens";

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
  const featureEnabled = LiveConfig.getValueByKey("feature_cal_lazy_loading");
  if (!featureEnabled) {
    return legacyStore;
  }

  if (!cryptoAssetsStore) {
    throw new Error("CryptoAssetsStore is not set. Please call setCryptoAssetsStore first.");
  }

  return cryptoAssetsStore;
}

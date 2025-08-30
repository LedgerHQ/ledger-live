import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
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

  const featureEnabled =
    LiveConfig.isConfigSet() && LiveConfig.getValueByKey("feature_cal_lazy_loading");
  if (!featureEnabled) {
    return legacyStore;
  }

  if (!cryptoAssetsStore) {
    throw new Error("CryptoAssetsStore is not set. Please call setCryptoAssetsStore first.");
  }

  return cryptoAssetsStore;
}

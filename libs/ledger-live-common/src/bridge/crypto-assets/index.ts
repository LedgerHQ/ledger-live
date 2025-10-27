import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import { legacyCryptoAssetsStore } from "@ledgerhq/cryptoassets/legacy/legacy-store";

let cryptoAssetsStore: CryptoAssetsStore | undefined = undefined;

export function setCryptoAssetsStore(store: CryptoAssetsStore) {
  cryptoAssetsStore = store;
}

export function getCryptoAssetsStore(): CryptoAssetsStore {
  const featureEnabled =
    LiveConfig.isConfigSet() && LiveConfig.getValueByKey("feature_cal_lazy_loading");
  if (!featureEnabled) {
    return legacyCryptoAssetsStore;
  }

  if (!cryptoAssetsStore) {
    throw new Error("CryptoAssetsStore is not set. Please call setCryptoAssetsStore first.");
  }

  return cryptoAssetsStore;
}

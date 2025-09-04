import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";

export type AddTokens = (tokens: TokenCurrency[]) => void;

// Resolves an addTokens function from a CryptoAssetsStore getter, if available
// Returns null if the store is not set yet or does not support dynamic additions
export function resolveTokenAdder(getStore: () => CryptoAssetsStore): AddTokens | null {
  try {
    const store = getStore();
    return store?.addTokens?.bind(store) || null;
  } catch (_) {
    // store not set yet
  }
  return null;
}

export function isCalLazyLoadingActive(getStore: () => CryptoAssetsStore): boolean {
  try {
    const value = LiveConfig.getValueByKey("feature_cal_lazy_loading");
    const enabled = value === true || value === "true";
    const hasDynamic = resolveTokenAdder(getStore) !== null;
    return enabled && hasDynamic;
  } catch (e) {
    return false;
  }
}

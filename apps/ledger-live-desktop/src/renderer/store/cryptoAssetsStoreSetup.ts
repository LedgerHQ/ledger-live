import type { Store } from "@reduxjs/toolkit";
import { setCryptoAssetsStore } from "@ledgerhq/live-common/bridge/crypto-assets/index";
import { setCryptoAssetsStore as setCryptoAssetsStoreForCoinFramework } from "@ledgerhq/coin-framework/crypto-assets/index";
import { setCryptoAssetsStoreForTokens } from "@ledgerhq/cryptoassets/tokens";
import { CachedCryptoAssetsStore } from "./CachedCryptoAssetsStore";
import { CryptoAssetsCache } from "./cryptoAssetsCache";
import { log } from "@ledgerhq/logs";
// import { withLegacyFallback } from "./withLegacyFallback";

export function setupCryptoAssetsStore(store: Store): void {
  const cachedStore = new CachedCryptoAssetsStore(store);

  // Disabled for now, but during the transition, we will use the fallback
  // const storeWithFallback = withLegacyFallback(cachedStore);
  const storeWithFallback = cachedStore;

  setCryptoAssetsStore(storeWithFallback);
  setCryptoAssetsStoreForCoinFramework(storeWithFallback);
  setCryptoAssetsStoreForTokens(storeWithFallback);

  const stats = CryptoAssetsCache.getStats();
  log("crypto-assets-cache", "CryptoAssetsStore cache initialized", {
    tokenCount: stats.tokenCount,
    cacheSize: stats.cacheSize,
    lastUpdated: stats.lastUpdated?.toLocaleString(),
  });
}

/**
 * Utility to clear cache if needed
 */
export function clearCryptoAssetsCache(): void {
  CryptoAssetsCache.clear();
  log("crypto-assets-cache", "CryptoAssetsStore cache cleared");
}

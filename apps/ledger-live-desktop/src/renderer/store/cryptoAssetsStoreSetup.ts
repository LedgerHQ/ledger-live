import type { Store } from "@reduxjs/toolkit";
import { setCryptoAssetsStore } from "@ledgerhq/live-common/bridge/crypto-assets/index";
import { setCryptoAssetsStore as setCryptoAssetsStoreForCoinFramework } from "@ledgerhq/coin-framework/crypto-assets/index";
import {
  createCryptoAssetsApi,
  createRtkCryptoAssetsStore,
} from "@ledgerhq/cryptoassets/rtk-store";
import { createIndexedDBCacheAdapter } from "@ledgerhq/live-persistence/implementations/indexed-db.web";
import type { HttpCacheResult } from "@ledgerhq/live-persistence";
import { createCryptoAssetsHooks } from "@ledgerhq/cryptoassets/hooks";
import { getEnv } from "@ledgerhq/live-env";

// Create the cache adapter
export const cryptoAssetsCacheAdapter = createIndexedDBCacheAdapter<HttpCacheResult>(
  {
    ttl: 24 * 60 * 60, // 1 day - when to evict from cache
    refreshTtl: 4 * 60 * 60, // 4 hours - when to refresh in background
    version: 1, // Cache version for schema changes
  },
  "crypto-assets-cache",
  "tokens",
);

// Create the crypto assets API instance
export const cryptoAssetsApi = createCryptoAssetsApi({
  baseUrl: getEnv("CAL_SERVICE_URL"),
  cacheAdapter: cryptoAssetsCacheAdapter,
  clientVersion: getEnv("LEDGER_CLIENT_VERSION"),
});

export const cryptoAssetsHooks = createCryptoAssetsHooks({
  useCALBackend: true,
  api: cryptoAssetsApi,
});

export function setupCryptoAssetsStore(store: Store): void {
  // Create the RTK Query store from the library with IndexedDB storage
  const cryptoAssetsStore = createRtkCryptoAssetsStore(cryptoAssetsApi, async <T>(action: T) => {
    return store.dispatch(action as Parameters<typeof store.dispatch>[0]) as unknown;
  });

  setCryptoAssetsStore(cryptoAssetsStore);
  setCryptoAssetsStoreForCoinFramework(cryptoAssetsStore);

  // Background cleanup of expired cache entries on startup
  cryptoAssetsCacheAdapter
    .cleanupExpired()
    .then(cleanedCount => {
      if (cleanedCount > 0) {
        console.log(`Crypto assets cache: cleaned up ${cleanedCount} expired entries`);
      }
    })
    .catch(error => {
      console.warn("Failed to cleanup expired crypto assets cache entries:", error);
    });
}

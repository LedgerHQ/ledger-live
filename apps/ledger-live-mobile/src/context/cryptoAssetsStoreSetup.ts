import { createMMKVCacheAdapter } from "@ledgerhq/live-persistence/implementations/mmkv.native";
import { mmkv } from "../newArch/storage/mmkvStorageWrapper";
import {
  createCryptoAssetsApi,
  createRtkCryptoAssetsStore,
} from "@ledgerhq/cryptoassets/rtk-store";
import { getEnv } from "@ledgerhq/live-env";
import { HttpCacheResult } from "@ledgerhq/live-persistence";
import { setCryptoAssetsStore } from "@ledgerhq/live-common/bridge/crypto-assets/index";
import { setCryptoAssetsStore as setCryptoAssetsStoreForCoinFramework } from "@ledgerhq/coin-framework/crypto-assets/index";
import { StoreType } from "./store";

export const cryptoAssetsCacheAdapter = createMMKVCacheAdapter<HttpCacheResult>(
  mmkv,
  {
    ttl: 24 * 60 * 60,
    refreshTtl: 4 * 60 * 60,
    version: 1,
  },
  "crypto-assets-cache",
);

export const cryptoAssetsApi = createCryptoAssetsApi({
  baseUrl: getEnv("CAL_SERVICE_URL"),
  cacheAdapter: cryptoAssetsCacheAdapter,
  clientVersion: getEnv("LEDGER_CLIENT_VERSION"),
});

export function setupCryptoAssetsStore(store: StoreType) {
  const cryptoAssetsStore = createRtkCryptoAssetsStore(cryptoAssetsApi, async <T>(action: T) => {
    return store.dispatch(action as Parameters<typeof store.dispatch>[0]) as unknown;
  });

  setCryptoAssetsStore(cryptoAssetsStore);
  setCryptoAssetsStoreForCoinFramework(cryptoAssetsStore);

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

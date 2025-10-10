import type { Store } from "@reduxjs/toolkit";
import { setCryptoAssetsStore } from "@ledgerhq/live-common/bridge/crypto-assets/index";
import { setCryptoAssetsStore as setCryptoAssetsStoreForCoinFramework } from "@ledgerhq/coin-framework/crypto-assets/index";
import { cryptoAssetsApi, createRtkCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client";
import { createCryptoAssetsHooks } from "@ledgerhq/cryptoassets/hooks";

export const cryptoAssetsHooks = createCryptoAssetsHooks({
  useCALBackend: true,
});

export function setupCryptoAssetsStore(store: Store): void {
  const cryptoAssetsStore = createRtkCryptoAssetsStore(cryptoAssetsApi, async <T>(action: T) => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return store.dispatch(action as Parameters<typeof store.dispatch>[0]) as unknown;
  });

  setCryptoAssetsStore(cryptoAssetsStore);
  setCryptoAssetsStoreForCoinFramework(cryptoAssetsStore);
}

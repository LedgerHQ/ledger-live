import type { Store } from "@reduxjs/toolkit";
import { setCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { cryptoAssetsApi, createRtkCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client";

export function setupCryptoAssetsStore(store: Store): void {
  const cryptoAssetsStore = createRtkCryptoAssetsStore(cryptoAssetsApi, async <T>(action: T) => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return store.dispatch(action as Parameters<typeof store.dispatch>[0]) as unknown;
  });

  // Set as global store in cryptoassets (single source of truth)
  setCryptoAssetsStore(cryptoAssetsStore);
}

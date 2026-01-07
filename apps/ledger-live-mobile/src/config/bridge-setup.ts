import { cryptoAssetsApi, createRtkCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client";
import { setCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { StoreType } from "../context/store";

export function setupCryptoAssetsStore(store: StoreType) {
  const cryptoAssetsStore = createRtkCryptoAssetsStore(cryptoAssetsApi, async <T>(action: T) => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return store.dispatch(action as Parameters<typeof store.dispatch>[0]) as unknown;
  });

  // Set as global store in cryptoassets (single source of truth)
  setCryptoAssetsStore(cryptoAssetsStore);
}

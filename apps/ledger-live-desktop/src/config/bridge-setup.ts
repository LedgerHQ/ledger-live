import { setCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { buildCryptoAssetsStore } from "@features/platform-currencies";
import type { ReduxStore } from "~/state-manager/configureStore";

export function setupCryptoAssetsStore(store: ReduxStore): void {
  // Single source of truth: delegate the legacy getCryptoAssetsStore singleton to the domain-backed
  // token store over the one cryptoAssetsApi cache registered in this store.
  setCryptoAssetsStore(buildCryptoAssetsStore({ dispatch: store.dispatch }));
}

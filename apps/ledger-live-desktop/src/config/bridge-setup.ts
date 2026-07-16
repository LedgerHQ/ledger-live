import { setCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { buildCryptoAssetsStore } from "@features/platform-currencies";
import { setCryptoAssetsStore as setFrameworkCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { ReduxStore } from "~/state-manager/configureStore";

export function setupCryptoAssetsStore(store: ReduxStore): void {
  const cryptoAssetsStore = buildCryptoAssetsStore({ dispatch: store.dispatch });
  setCryptoAssetsStore(cryptoAssetsStore);
  setFrameworkCryptoAssetsStore(cryptoAssetsStore);
}

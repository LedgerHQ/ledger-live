import { buildCryptoAssetsStore } from "@features/platform-currencies";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { withMockedArc20Tokens } from "@ledgerhq/live-common/families/aleo/arc20.mock";
import type { ReduxStore } from "~/state-manager/configureStore";

export function setupCryptoAssetsStore(store: ReduxStore): void {
  const cryptoAssetsStore = buildCryptoAssetsStore({ dispatch: store.dispatch });
  setCryptoAssetsStore(withMockedArc20Tokens(cryptoAssetsStore));
}

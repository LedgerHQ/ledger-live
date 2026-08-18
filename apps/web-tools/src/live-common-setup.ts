import "./live-common-setup-network";
import { registerAllCoins } from "@ledgerhq/live-common/coin-modules/load-all-coins";
import { setWalletAPIVersion } from "@ledgerhq/live-common/wallet-api/version";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { liveConfig } from "@ledgerhq/live-common/config/sharedConfig";
import { buildCryptoAssetsStore } from "@features/platform-currencies";
import { store } from "./store";
import {
  getCryptoCurrencyById,
  findCryptoCurrencyById,
  findCryptoCurrencyByScheme,
  listCryptoCurrencies,
  hasCryptoCurrencyId,
} from "@domain/entity-currency-crypto";
import { setCurrenciesResolver } from "@ledgerhq/ledger-wallet-framework/currencies";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";

// The domain registry is the runtime source of truth for currency data.
setCurrenciesResolver({
  getCryptoCurrencyById,
  findCryptoCurrencyById,
  findCryptoCurrencyByScheme,
  listCryptoCurrencies,
  hasCryptoCurrencyId,
});

LiveConfig.setConfig(liveConfig);
LiveConfig.setAppinfo({
  platform: "web",
});

setWalletAPIVersion(WALLET_API_VERSION);

// Register every coin module (and its signer) so the tools have exactly the
// same coin support as Ledger Live Desktop. Without this, account flows fail
// with "No coin module registered for family ..." / "No signer registered ...".
registerAllCoins();

export function setupCryptoAssetsStore(): void {
  setCryptoAssetsStore(buildCryptoAssetsStore({ dispatch: store.dispatch }));
}

setupCryptoAssetsStore();

import "./live-common-setup-network";
import { registerAllCoins } from "@ledgerhq/live-common/coin-modules/load-all-coins";
import { setWalletAPIVersion } from "@ledgerhq/live-common/wallet-api/version";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { liveConfig } from "@ledgerhq/live-common/config/sharedConfig";
import { setCryptoCurrenciesStore, setFiatCurrenciesStore } from "@ledgerhq/cryptoassets";
import { setCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { buildCryptoAssetsStore } from "@features/platform-currencies";
import { store } from "./store";
import {
  CRYPTO_CURRENCIES_REGISTRY,
  CRYPTO_CURRENCY_ALIASES,
  getCryptoCurrencyById,
  findCryptoCurrencyById,
  findCryptoCurrencyByScheme,
  listCryptoCurrencies,
  hasCryptoCurrencyId,
} from "@domain/entity-currency-crypto";
import { FIAT_CURRENCIES_REGISTRY } from "@domain/entity-currency-fiat";
import { setCurrenciesResolver } from "@ledgerhq/ledger-wallet-framework/currencies";
import { setCryptoAssetsStore as setFrameworkCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";

// The domain registries are the runtime source of truth for currency data.
setCryptoCurrenciesStore(Object.values(CRYPTO_CURRENCIES_REGISTRY), CRYPTO_CURRENCY_ALIASES);
setFiatCurrenciesStore(Object.values(FIAT_CURRENCIES_REGISTRY));
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
  const cryptoAssetsStore = buildCryptoAssetsStore({ dispatch: store.dispatch });
  setCryptoAssetsStore(cryptoAssetsStore);
  setFrameworkCryptoAssetsStore(cryptoAssetsStore);
}

setupCryptoAssetsStore();

import { buildStandaloneCryptoAssetsStore } from "@features/platform-currencies/legacy";
import { walletCliConfig } from "./config";
import { walletCliLoaders } from "./coin-module-loaders";
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import { setWalletAPIVersion } from "@ledgerhq/live-common/wallet-api/version";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import { setupStandaloneSwapQuotesStore } from "@ledgerhq/live-common/wallet-api/Exchange/quotes/state-manager/standaloneStore";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { setEnv, getEnv } from "@shared/env";
import { bridgeEnvToNetworkState } from "@ledgerhq/live-common/network/setup";
import { registerWalletCliDmkTransport } from "./device/register-dmk-transport";
import {
  getCryptoCurrencyById,
  findCryptoCurrencyById,
  findCryptoCurrencyByScheme,
  listCryptoCurrencies,
  hasCryptoCurrencyId,
} from "@domain/entity-currency-crypto";
import { setCurrenciesResolver } from "@ledgerhq/ledger-wallet-framework/currencies";
import { setCryptoAssetsStore as setFrameworkCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import pkg from "../package.json" with { type: "json" };

/**
 * Ensure USER_ID is set so DMK firmware distribution salt is stable for this CLI.
 */
if (!process.env.USER_ID) {
  process.env.USER_ID = "wallet-cli";
}

const ledgerClientVersion = `wallet-cli/${pkg.version}`;
setEnv("LEDGER_CLIENT_VERSION", ledgerClientVersion);
process.env.LEDGER_CLIENT_VERSION = ledgerClientVersion;
bridgeEnvToNetworkState();

setCurrenciesResolver({
  getCryptoCurrencyById,
  findCryptoCurrencyById,
  findCryptoCurrencyByScheme,
  listCryptoCurrencies,
  hasCryptoCurrencyId,
});
setWalletAPIVersion(WALLET_API_VERSION);
registerCoinModules(walletCliLoaders);
LiveConfig.setConfig(walletCliConfig);
setFrameworkCryptoAssetsStore(
  buildStandaloneCryptoAssetsStore({
    calServiceUrl: getEnv("CAL_SERVICE_URL"),
    ledgerClientVersion,
  }),
);
// `getQuotes` needs a store dispatch; wallet-cli has no app Redux store.
setupStandaloneSwapQuotesStore({
  swapApiBaseUrl: getEnv("SWAP_API_BASE"),
  ledgerClientVersion,
});
registerWalletCliDmkTransport();

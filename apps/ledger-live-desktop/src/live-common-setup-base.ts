import os from "os";
import { setEnv, getEnv } from "@shared/env";
import { bridgeEnvToNetworkState } from "@ledgerhq/live-common/network/setup";
import { liveBlindSigningReporter } from "@ledgerhq/live-dmk-shared";
import {
  getCryptoCurrencyById,
  findCryptoCurrencyById,
  findCryptoCurrencyByScheme,
  listCryptoCurrencies,
  hasCryptoCurrencyId,
} from "@domain/entity-currency-crypto";
import { setCurrenciesResolver } from "@ledgerhq/ledger-wallet-framework/currencies";
import BigNumber from "bignumber.js";

// The domain registry is the runtime source of truth for currency data.
setCurrenciesResolver({
  getCryptoCurrencyById,
  findCryptoCurrencyById,
  findCryptoCurrencyByScheme,
  listCryptoCurrencies,
  hasCryptoCurrencyId,
});

let ledgerClientVersion = `lld/${__APP_VERSION__}`;

if (process.env.NODE_ENV !== "production") {
  ledgerClientVersion += "-dev";
}

setEnv("LEDGER_CLIENT_VERSION", ledgerClientVersion);

process.env.LEDGER_CLIENT_VERSION = ledgerClientVersion;
bridgeEnvToNetworkState();

liveBlindSigningReporter.setContext({
  platform: "desktop",
  appVersion: __APP_VERSION__,
  platformOS: process.platform,
  platformVersion: os.release(),
});

BigNumber.set({ DECIMAL_PLACES: getEnv("BIG_NUMBER_DECIMAL_PLACES") });

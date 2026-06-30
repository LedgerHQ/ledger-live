import os from "os";
import { setEnv, getEnv } from "@ledgerhq/live-env";
import { liveBlindSigningReporter } from "@ledgerhq/live-dmk-shared";
import BigNumber from "bignumber.js";
import { setCryptoCurrenciesStore } from "@ledgerhq/cryptoassets";
import {
  CRYPTO_CURRENCIES_REGISTRY,
  CRYPTO_CURRENCY_ALIASES,
} from "@domain/entity-currency-crypto";

// The domain registry is the runtime source of truth for currency data.
setCryptoCurrenciesStore(Object.values(CRYPTO_CURRENCIES_REGISTRY), CRYPTO_CURRENCY_ALIASES);

let ledgerClientVersion = `lld/${__APP_VERSION__}`;

if (process.env.NODE_ENV !== "production") {
  ledgerClientVersion += "-dev";
}

setEnv("LEDGER_CLIENT_VERSION", ledgerClientVersion);

process.env.LEDGER_CLIENT_VERSION = ledgerClientVersion;

liveBlindSigningReporter.setContext({
  platform: "desktop",
  appVersion: __APP_VERSION__,
  platformOS: process.platform,
  platformVersion: os.release(),
});

BigNumber.set({ DECIMAL_PLACES: getEnv("BIG_NUMBER_DECIMAL_PLACES") });

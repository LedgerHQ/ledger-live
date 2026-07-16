import os from "os";
import { setEnv, getEnv } from "@ledgerhq/live-env";
import { liveBlindSigningReporter } from "@ledgerhq/live-dmk-shared";
import { setCryptoCurrenciesStore, setFiatCurrenciesStore } from "@ledgerhq/cryptoassets";
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
import BigNumber from "bignumber.js";

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

"use strict";

// Ensure live-env definitions are injected before any getEnv() call in tests.
// @shared/live-env calls injectDefinitions(allDefinitions) at module load via sideEffects.
require("@shared/live-env");

const {
  getCryptoCurrencyById,
  findCryptoCurrencyById,
  findCryptoCurrencyByScheme,
  listCryptoCurrencies,
  hasCryptoCurrencyId,
} = require("@domain/entity-currency-crypto");
const { setCurrenciesResolver } = require("@ledgerhq/ledger-wallet-framework/currencies");
const { setCryptoAssetsStore } = require("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore");

setCryptoAssetsStore({
  findTokenById: async () => undefined,
  findTokenByAddressInCurrency: async () => undefined,
  getTokensSyncHash: async () => "",
});

setCurrenciesResolver({
  getCryptoCurrencyById,
  findCryptoCurrencyById,
  findCryptoCurrencyByScheme,
  listCryptoCurrencies,
  hasCryptoCurrencyId,
});

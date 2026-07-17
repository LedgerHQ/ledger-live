"use strict";

const {
  getCryptoCurrencyById,
  findCryptoCurrencyById,
  findCryptoCurrencyByScheme,
  listCryptoCurrencies,
  hasCryptoCurrencyId,
} = require("@domain/entity-currency-crypto");
const { setupMockCryptoAssetsStore } = require("@ledgerhq/cryptoassets/cal-client/test-helpers");
const { getCryptoAssetsStore } = require("@ledgerhq/cryptoassets/state");
const { setCurrenciesResolver } = require("@ledgerhq/ledger-wallet-framework/currencies");
const { setCryptoAssetsStore } = require("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore");

setupMockCryptoAssetsStore();

// Forward framework port calls to the cryptoassets global store so
// setupMockCryptoAssetsStore() in individual tests automatically propagates.
setCryptoAssetsStore({
  findTokenById: id => getCryptoAssetsStore().findTokenById(id),
  findTokenByAddressInCurrency: (addr, currencyId, tokenIdentifier) =>
    getCryptoAssetsStore().findTokenByAddressInCurrency(addr, currencyId, tokenIdentifier),
  getTokensSyncHash: currencyId => getCryptoAssetsStore().getTokensSyncHash(currencyId),
});

setCurrenciesResolver({
  getCryptoCurrencyById,
  findCryptoCurrencyById,
  findCryptoCurrencyByScheme,
  listCryptoCurrencies,
  hasCryptoCurrencyId,
});

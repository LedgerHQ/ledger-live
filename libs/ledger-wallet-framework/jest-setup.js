"use strict";

const {
  injectDefinitions,
  intParser,
  boolParser,
  stringParser,
  stringArrayParser,
} = require("@ledgerhq/live-env");

injectDefinitions({
  ADDRESS_POISONING_FAMILIES: {
    def: "evm,tron,stellar,hedera,algorand,cardano,cosmos,solana,xrp",
    parser: stringParser,
    desc: "",
  },
  HIDE_EMPTY_TOKEN_ACCOUNTS: { def: false, parser: boolParser, desc: "" },
  KEYCHAIN_OBSERVABLE_RANGE: { def: 0, parser: intParser, desc: "" },
  MOCK: { def: "", parser: stringParser, desc: "" },
  NFT_CURRENCIES: {
    def: ["avalanche_c_chain", "bsc", "ethereum", "polygon", "solana"],
    parser: stringArrayParser,
    desc: "",
  },
  OPERATION_OPTIMISTIC_RETENTION: { def: 30 * 60 * 1000, parser: intParser, desc: "" },
  SANCTIONED_ADDRESSES_URL: {
    def: "https://compliance.ledger.com/all_sanctioned_addresses_without_ticker.json",
    parser: stringParser,
    desc: "",
  },
  SCAN_FOR_INVALID_PATHS: { def: false, parser: boolParser, desc: "" },
  SHOW_LEGACY_NEW_ACCOUNT: { def: false, parser: boolParser, desc: "" },
  SYNC_OUTDATED_CONSIDERED_DELAY: { def: 10 * 60 * 1000, parser: intParser, desc: "" },
});

const {
  getCryptoCurrencyById,
  findCryptoCurrencyById,
  findCryptoCurrencyByScheme,
  listCryptoCurrencies,
  hasCryptoCurrencyId,
} = require("@domain/entity-currency-crypto");
const { setCurrenciesResolver } = require("./src/currencies");
const { setCryptoAssetsStore } = require("./src/cryptoAssetsStore");

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

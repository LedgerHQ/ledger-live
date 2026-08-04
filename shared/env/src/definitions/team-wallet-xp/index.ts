import { intParser, boolParser, stringParser, stringArrayParser } from "@ledgerhq/live-env";

const teamWalletXp = {
  LEDGER_COUNTERVALUES_API: {
    def: "https://countervalues.live.ledger.com",
    parser: stringParser,
    desc: "Ledger countervalues API",
  },
  LEDGER_COUNTERVALUES_API_STAGING: {
    def: "https://countervalues-service.api.ledger-test.com",
    parser: stringParser,
    desc: "Ledger countervalues API (staging)",
  },
  DADA_API_STAGING: {
    def: "https://dada.api.ledger-test.com/v1",
    parser: stringParser,
    desc: "Dynamic Assets Data Aggregator API Staging",
  },
  DADA_API_PROD: {
    def: "https://dada.api.ledger.com/v1",
    parser: stringParser,
    desc: "Dynamic Assets Data Aggregator API Prod",
  },
  CMC_API_URL: {
    def: "https://proxycmc.api.live.ledger.com/v3",
    parser: stringParser,
    desc: "CoinMarketCap API",
  },
  COINGECKO_API_URL: {
    def: "https://proxycg.api.live.ledger.com/api/v3",
    parser: stringParser,
    desc: "Coingecko API",
  },
  MAPPING_SERVICE: {
    def: "https://mapping-service.api.ledger.com",
    parser: stringParser,
    desc: "",
  },
  MAX_ACCOUNT_NAME_SIZE: {
    def: 50,
    parser: intParser,
    desc: "maximum size of account names",
  },
  BIG_NUMBER_DECIMAL_PLACES: {
    def: 40,
    parser: intParser,
    desc: "bignumber.js decimal places configuration",
  },
  CRYPTO_ASSET_SEARCH_KEYS: {
    def: ["ticker", "name", "keywords"],
    parser: stringArrayParser,
    desc: "Fuse search attributes to find a currency according to user input",
  },
  DEBUG_THEME: {
    def: false,
    parser: boolParser,
    desc: "Show theme debug overlay UI",
  },
  MOCK_COUNTERVALUES: {
    def: "",
    parser: stringParser,
    desc: "switch the countervalues resolution into a MOCK mode for test purpose",
  },
  HIDE_EMPTY_TOKEN_ACCOUNTS: {
    def: false,
    parser: boolParser,
    desc: "hide the sub accounts when they are empty",
  },
  SHOW_LEGACY_NEW_ACCOUNT: {
    def: false,
    parser: boolParser,
    desc: "allow the creation of legacy accounts",
  },
  LW_ICONS_AVATARS_CDN_BASE_URL: {
    def: "https://lw-icons.ledger.com/cdn/Avatars/v1/192x192",
    parser: stringParser,
    desc: "Base URL for Ledger Wallet icons CDN",
  },
  EXPERIMENTAL_LANGUAGES: {
    def: false,
    parser: boolParser,
    desc: "enable experimental languages",
  },
  EXPERIMENTAL_ROI_CALCULATION: {
    def: false,
    parser: boolParser,
    desc: "enable an experimental version of the portfolio percentage calculation",
  },
};

export default teamWalletXp;

import { boolParser, stringParser } from "@ledgerhq/live-env";

const teamPtx = {
  SWAP_API_BASE: {
    def: "https://swap.ledger.com/v5",
    parser: stringParser,
    desc: "Swap API base",
  },
  SWAP_USER_IP: {
    def: "",
    parser: stringParser,
    desc: "Swap IP",
  },
  SWAP_DISABLE_APPS_INSTALL: {
    def: false,
    parser: boolParser,
    desc: "bypass app checks on Nano for speculos swap tests",
  },
  /**
   * Note: the mocked cryptoassets config and test partner are signed with the
   * Ledger test private key
   */
  MOCK_EXCHANGE_TEST_CONFIG: {
    def: false,
    parser: boolParser,
    desc: "mock the cryptoassets config and test partner (in the context of app-exchange)",
  },
  MOCK_EXCHANGE_TEST_PARTNER: {
    def: false,
    parser: boolParser,
    desc: "change CAL partner context to test",
  },
  EXPERIMENTAL_SWAP: {
    def: false,
    parser: boolParser,
    desc: "enable an experimental swap interface",
  },
  BUY_API_BASE: {
    def: "https://buy.api.live.ledger.com/buy/v1",
    parser: stringParser,
    desc: "Buy crypto API base url - version 1",
  },
  SELL_API_BASE: {
    def: "https://buy.api.live.ledger.com/sell/v1",
    parser: stringParser,
    desc: "Sell crypto API base url - version 1",
  },
  PROVIDER_SESSION_ID_ENDPOINT: {
    def: "https://buy.api.live.ledger.com/session",
    parser: stringParser,
    desc: "Request provider session id",
  },
  PAY_CARD_API_BASE_URL: {
    // Baanx's dev environment, called directly rather than through a Ledger proxy. No version prefix:
    // the endpoint paths carry `/v1`, and RTK joins the two verbatim.
    def: "https://dev.api.baanx.com",
    parser: stringParser,
    desc: "Pay Card API base URL (Baanx dev)",
  },
  CARD_BAANX_CLIENT_KEY: {
    // No default: the key is environment-specific and only the Card flow needs it.
    def: "",
    parser: stringParser,
    desc: "Baanx public client key, sent as x-client-key on every Pay Card API request",
  },
};

export default teamPtx;

import { XrpCoinConfig } from "@ledgerhq/coin-xrp/config";
import { CurrencyLiveConfigDefinition } from "../../config";

export const XRP_TOKEN_STANDARDS = ["iou", "mpt"] as const;
export type XrpTokenStandard = (typeof XRP_TOKEN_STANDARDS)[number];

// LIVE-39298: replace with the coin-xrp type once the package ships `enableTokenStandards`
export type XrpLiveCoinConfig = XrpCoinConfig & { enableTokenStandards?: XrpTokenStandard[] };

export const xrpConfig: CurrencyLiveConfigDefinition = {
  config_currency_ripple: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "XRP",
      unit: { name: "XRP", code: "XRP", magnitude: 6 },
      node: "https://xrp.coin.ledger.com",
      enableTokenStandards: [],
    } satisfies XrpLiveCoinConfig,
  },
  config_currency_ripple_testnet: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "XRP (Testnet)",
      unit: { name: "XRP", code: "XRP", magnitude: 6 },
      node: "https://s.altnet.rippletest.net:51234",
      enableTokenStandards: [],
    } satisfies XrpLiveCoinConfig,
  },
  config_currency_ripple_devnet: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "XRP (Devnet)",
      unit: { name: "XRP", code: "XRP", magnitude: 6 },
      node: "https://s.devnet.rippletest.net:51234",
      enableTokenStandards: [],
    } satisfies XrpLiveCoinConfig,
  },
};

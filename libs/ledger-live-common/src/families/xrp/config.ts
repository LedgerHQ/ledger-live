import { XrpCoinConfig } from "@ledgerhq/coin-xrp/config";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { CurrencyLiveConfigDefinition, getCurrencyConfiguration } from "../../config";

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
      enabledTokenStandards: [],
    } satisfies XrpCoinConfig,
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
      // TEMP prototype: tokens on without Firebase
      enabledTokenStandards: ["iou", "mpt"],
    } satisfies XrpCoinConfig,
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
      enabledTokenStandards: [],
    } satisfies XrpCoinConfig,
  },
};

export const getXrpEnabledTokenStandards = (currency: CryptoCurrency): string[] => {
  return getCurrencyConfiguration<XrpCoinConfig>(currency.id).enabledTokenStandards ?? [];
};

import { XrpCoinConfig } from "@ledgerhq/coin-xrp/config";
import { CurrencyLiveConfigDefinition } from "../../config";

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
    } as XrpCoinConfig,
  },
};

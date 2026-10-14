import { HypercoreCoinConfig } from "@ledgerhq/coin-hypercore/config";
import { CurrencyLiveConfigDefinition } from "../../config";

export const hypercoreConfig: CurrencyLiveConfigDefinition = {
  config_currency_hypercore: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Hyperliquid",
      unit: { name: "USD Coin", code: "USDC", magnitude: 6 },
      node: "https://perps.live.ledger.com/proxy/perps",
      checkRegionRestriction: true,
    } satisfies HypercoreCoinConfig,
  },
};

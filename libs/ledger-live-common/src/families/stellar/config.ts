import type { StellarCoinConfig } from "@ledgerhq/coin-stellar/config";
import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const stellarConfig: Record<string, ConfigInfo> = {
  config_currency_stellar: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Stellar",
      unit: { name: "Lumen", code: "XLM", magnitude: 7 },
      explorer: {
        url: "https://stellar.coin.ledger.com",
        fetchLimit: 100,
      },
      useStaticFees: false,
      enableNetworkLogs: false,
    } satisfies StellarCoinConfig,
  },
};

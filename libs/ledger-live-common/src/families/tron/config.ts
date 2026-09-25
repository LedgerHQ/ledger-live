import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";
import { getEnv } from "@shared/env";

export const tronConfig: Record<string, ConfigInfo> = {
  config_currency_tron: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [
          { id: "blockchain_txs", status: "active" },
          { id: "staking_txs", status: "active" },
        ],
      },
      name: "Tron",
      unit: { name: "TRX", code: "TRX", magnitude: 6 },
      explorer: {
        url: getEnv("API_TRONGRID_PROXY"),
      },
    },
  },
};

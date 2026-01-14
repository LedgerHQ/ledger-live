import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";
import { getEnv } from "@ledgerhq/live-env";

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
      explorer: {
        url: getEnv("API_TRONGRID_PROXY"),
      },
    },
  },
};

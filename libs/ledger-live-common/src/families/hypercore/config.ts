import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const hypercoreConfig: Record<string, ConfigInfo> = {
  config_currency_hypercore: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      infoUrl: "https://api.hyperliquid.xyz/info",
    },
  },
};

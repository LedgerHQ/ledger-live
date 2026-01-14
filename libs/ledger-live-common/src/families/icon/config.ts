import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const iconConfig: Record<string, ConfigInfo> = {
  config_currency_icon: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [
          { id: "blockchain_txs", status: "active" },
          { id: "staking_txs", status: "active" },
        ],
      },
    },
  },
};

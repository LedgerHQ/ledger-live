import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";
import { getEnv } from "@ledgerhq/live-env";

export const suiConfig: Record<string, ConfigInfo> = {
  config_currency_sui: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        url: getEnv("API_SUI_NODE_PROXY"),
      },
    },
  },
};

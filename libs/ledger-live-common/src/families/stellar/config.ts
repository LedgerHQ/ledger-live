import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";
import { getEnv } from "@ledgerhq/live-env";

export const stellarConfig: Record<string, ConfigInfo> = {
  config_currency_stellar: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      explorer: {
        url: getEnv<string>("API_STELLAR_HORIZON"),
        fetchLimit: getEnv<number>("API_STELLAR_HORIZON_FETCH_LIMIT"),
      },
      useStaticFees: getEnv<boolean>("API_STELLAR_HORIZON_STATIC_FEE"),
      enableNetworkLogs: getEnv<boolean>("ENABLE_NETWORK_LOGS"),
    },
  },
};

import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";
import { getEnv } from "@ledgerhq/live-env";

export const stellarConfig: Record<string, ConfigInfo> = {
  config_currency_stellar: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      explorer: {
        url: getEnv("API_STELLAR_HORIZON"),
        fetchLimit: getEnv("API_STELLAR_HORIZON_FETCH_LIMIT"),
      },
      useStaticFees: getEnv("API_STELLAR_HORIZON_STATIC_FEE"),
      enableNetworkLogs: getEnv("ENABLE_NETWORK_LOGS"),
    },
  },
};

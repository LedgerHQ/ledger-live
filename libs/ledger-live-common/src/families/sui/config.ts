import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";
// import { getEnv } from "@ledgerhq/live-env";

export const suiConfig: Record<string, ConfigInfo> = {
  config_currency_sui: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      node: {
        // url: getEnv("API_SUI_NODE"),
        url: "http://127.0.0.1:9000",
      },
    },
  },
};

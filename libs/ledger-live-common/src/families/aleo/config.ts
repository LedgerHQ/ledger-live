import type { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";
import { getEnv } from "@ledgerhq/live-env";

export const aleoConfig: Record<string, ConfigInfo> = {
  config_currency_aleo: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      nodeUrl: getEnv("ALEO_MAINNET_NODE_ENDPOINT"),
      networkType: "mainnet",
      apiUrls: {
        node: getEnv("ALEO_MAINNET_NODE_ENDPOINT"),
        sdk: getEnv("ALEO_MAINNET_SDK_ENDPOINT"),
      },
    },
  },
  config_currency_aleo_testnet: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      nodeUrl: getEnv("ALEO_TESTNET_NODE_ENDPOINT"),
      networkType: "testnet",
      apiUrls: {
        node: getEnv("ALEO_TESTNET_NODE_ENDPOINT"),
        sdk: getEnv("ALEO_TESTNET_SDK_ENDPOINT"),
      },
    },
  },
};

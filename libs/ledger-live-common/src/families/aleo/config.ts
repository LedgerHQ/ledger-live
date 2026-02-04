import type { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";
import { getEnv } from "@ledgerhq/live-env";
import { feesByTransactionType, ESTIMATED_FEE_SAFETY_RATE } from "@ledgerhq/coin-aleo";

export const aleoConfig: Record<string, ConfigInfo> = {
  config_currency_aleo: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      networkType: "mainnet",
      apiUrls: {
        node: getEnv("ALEO_MAINNET_NODE_ENDPOINT"),
        sdk: getEnv("ALEO_MAINNET_SDK_ENDPOINT"),
      },
      feesByTransactionType,
      estimatedFeeSafetyRate: ESTIMATED_FEE_SAFETY_RATE,
    },
  },
  config_currency_aleo_testnet: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      networkType: "testnet",
      apiUrls: {
        node: getEnv("ALEO_TESTNET_NODE_ENDPOINT"),
        sdk: getEnv("ALEO_TESTNET_SDK_ENDPOINT"),
      },
      feesByTransactionType,
      estimatedFeeSafetyRate: ESTIMATED_FEE_SAFETY_RATE,
    },
  },
};

import { TRANSACTION_TYPE } from "@ledgerhq/coin-aleo/constants";
import type { TransactionType } from "@ledgerhq/coin-aleo/types";
import type { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";
import { getEnv } from "@ledgerhq/live-env";

const DEFAULT_FEE_BY_TRANSACTION_TYPE: Record<TransactionType, number> = {
  [TRANSACTION_TYPE.TRANSFER_PUBLIC]: 34060,
  [TRANSACTION_TYPE.TRANSFER_PRIVATE]: 2308,
  [TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE]: 17972,
  [TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC]: 18494,
};

const DEFAULT_FEE_SAFETY_MULTIPLIER = 1;

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
      feeByTransactionType: DEFAULT_FEE_BY_TRANSACTION_TYPE,
      feeSafetyMultiplier: DEFAULT_FEE_SAFETY_MULTIPLIER,
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
      feeByTransactionType: DEFAULT_FEE_BY_TRANSACTION_TYPE,
      feeSafetyMultiplier: DEFAULT_FEE_SAFETY_MULTIPLIER,
    },
  },
};

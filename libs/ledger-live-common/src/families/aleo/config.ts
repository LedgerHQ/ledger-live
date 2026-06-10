import { TRANSACTION_TYPE } from "@ledgerhq/coin-aleo/constants";
import type { RecordPickingStrategy, TransactionType } from "@ledgerhq/coin-aleo/types";
import type { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";
import { getEnv } from "@ledgerhq/live-env";

// API for fee estimation is not available yet, so for MVP we are using static fee configuration.
// source of hardcoded values: https://ledgerhq.atlassian.net/wiki/spaces/BI/pages/6218678344/ARCH+-+Aleo+integration+HLD
const DEFAULT_FEE_BY_TRANSACTION_TYPE: Record<TransactionType, number> = {
  [TRANSACTION_TYPE.TRANSFER_PUBLIC]: 34060,
  [TRANSACTION_TYPE.TRANSFER_PRIVATE]: 2308,
  [TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE]: 17972,
  [TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC]: 18494,
  [TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC]: 34060,
  [TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE]: 2308,
  [TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC]: 18494,
  [TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE]: 17972,
};

const DEFAULT_FEE_SAFETY_MULTIPLIER = 1;

/**
 * Controls whether fee sponsorship for single-record private transactions
 * is enabled (fees paid by a 3rd party on behalf of the user).
 * @see https://ledgerhq.atlassian.net/browse/LIVE-27354
 */
const IS_FEE_SPONSORED = true;

/**
 * Controls whether encrypted proving is used for broadcasting transactions.
 * This is the target solution that should be enabled once fix on API side is done.
 * @see https://ledgerhq.atlassian.net/browse/LIVE-27542
 */
const USE_ENCRYPTED_PROVE = true;

/**
 * Controls how private transaction records are selected.
 * - "manual": user picks records explicitly via the record picker UI step.
 * - "auto": records are selected automatically (manual picker step is skipped).
 * Default is "manual" to preserve existing behaviour.
 */
const RECORD_PICKING_STRATEGY: RecordPickingStrategy = "manual";

/**
 * Controls whether Aleo token-related features are enabled.
 */
const ENABLE_TOKENS = false;

export const aleoConfig: Record<string, ConfigInfo> = {
  config_currency_aleo: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      networkType: "mainnet",
      apiUrls: {
        node: getEnv("ALEO_NODE_ENDPOINT"),
        sdk: getEnv("ALEO_MAINNET_SDK_ENDPOINT"),
      },
      feeByTransactionType: DEFAULT_FEE_BY_TRANSACTION_TYPE,
      feeSafetyMultiplier: DEFAULT_FEE_SAFETY_MULTIPLIER,
      isFeeSponsored: IS_FEE_SPONSORED,
      enableTokens: ENABLE_TOKENS,
      useEncryptedProve: USE_ENCRYPTED_PROVE,
      recordPickingStrategy: RECORD_PICKING_STRATEGY,
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
        node: getEnv("ALEO_NODE_ENDPOINT"),
        sdk: getEnv("ALEO_TESTNET_SDK_ENDPOINT"),
      },
      feeByTransactionType: DEFAULT_FEE_BY_TRANSACTION_TYPE,
      feeSafetyMultiplier: DEFAULT_FEE_SAFETY_MULTIPLIER,
      isFeeSponsored: IS_FEE_SPONSORED,
      enableTokens: ENABLE_TOKENS,
      useEncryptedProve: USE_ENCRYPTED_PROVE,
      recordPickingStrategy: RECORD_PICKING_STRATEGY,
    },
  },
};

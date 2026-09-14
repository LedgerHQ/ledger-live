import { TRANSACTION_TYPE } from "@ledgerhq/coin-aleo/constants";
import type {
  AleoCoinConfig,
  RecordPickingStrategy,
  TransactionType,
} from "@ledgerhq/coin-aleo/types";
import type { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";
import { getEnv } from "@shared/env";
import { getCurrencyConfiguration } from "../../config";

// API for fee estimation is not available yet, so for MVP we are using static fee configuration.
// source of hardcoded values: https://ledgerhq.atlassian.net/wiki/spaces/BI/pages/6218678344/ARCH+-+Aleo+integration+HLD
// should be removed once https://ledgerhq.atlassian.net/browse/LIVE-30580 is completed
const DEFAULT_FEE_BY_TRANSACTION_TYPE: Record<TransactionType, number> = {
  [TRANSACTION_TYPE.TRANSFER_PUBLIC]: 34060,
  [TRANSACTION_TYPE.TRANSFER_PRIVATE]: 2308,
  [TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE]: 17972,
  [TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC]: 18494,
  [TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC]: 34060,
  [TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE]: 2308,
  [TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC]: 18494,
  [TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE]: 17972,
  // measured from single-transition testnet transactions (credits.aleo, fee_public, priority fee 0),
  [TRANSACTION_TYPE.BOND_PUBLIC]: 5621,
  [TRANSACTION_TYPE.UNBOND_PUBLIC]: 10813,
  [TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC]: 3066,
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
const RECORD_PICKING_STRATEGY: RecordPickingStrategy = "auto";

/**
 * Controls whether Aleo token-related features are enabled.
 */
const ENABLE_TOKENS = false;

/**
 * Controls whether Aleo staking features (bond/unbond/claim) are enabled.
 */
const ENABLE_STAKING = true;

// Figment runs a different address on each network, both named "Figment" in the committee
// validator-metadata, so each network needs its own.
const MAINNET_DEFAULT_VALIDATOR = "aleo1q3vx8pet0h7739hx5xlekfxh9kus6qdlxhx9qdkxhh9rnva8q5gsskve3t";
const TESTNET_DEFAULT_VALIDATOR = "aleo1l7avejc23yv6e8nx4udjwz89dw6mg95dzsp936hf77yuhnjywv9syl0ywc";

export const aleoConfig: Record<string, ConfigInfo> = {
  config_currency_aleo: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      networkType: "mainnet",
      defaultValidator: MAINNET_DEFAULT_VALIDATOR,
      apiUrls: {
        node: getEnv("ALEO_NODE_ENDPOINT"),
        sdk: getEnv("ALEO_MAINNET_SDK_ENDPOINT"),
      },
      feeByTransactionType: DEFAULT_FEE_BY_TRANSACTION_TYPE,
      feeSafetyMultiplier: DEFAULT_FEE_SAFETY_MULTIPLIER,
      isFeeSponsored: IS_FEE_SPONSORED,
      enableTokens: ENABLE_TOKENS,
      enableStaking: ENABLE_STAKING,
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
      defaultValidator: TESTNET_DEFAULT_VALIDATOR,
      apiUrls: {
        node: getEnv("ALEO_NODE_ENDPOINT"),
        sdk: getEnv("ALEO_TESTNET_SDK_ENDPOINT"),
      },
      feeByTransactionType: DEFAULT_FEE_BY_TRANSACTION_TYPE,
      feeSafetyMultiplier: DEFAULT_FEE_SAFETY_MULTIPLIER,
      isFeeSponsored: IS_FEE_SPONSORED,
      enableTokens: ENABLE_TOKENS,
      enableStaking: ENABLE_STAKING,
      useEncryptedProve: USE_ENCRYPTED_PROVE,
      recordPickingStrategy: RECORD_PICKING_STRATEGY,
    },
  },
};

/** `undefined` until the configuration is loaded: LiveConfig throws for an unknown currency. */
export function getAleoCurrencyConfigById(currencyId: string): AleoCoinConfig | undefined {
  try {
    return getCurrencyConfiguration<AleoCoinConfig>(currencyId);
  } catch {
    return undefined;
  }
}

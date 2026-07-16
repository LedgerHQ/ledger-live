import type { OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

/**
 * Internal types to distinguish custom Hedera transaction behaviors.
 * These can be used in transaction.mode and used to route specific preparation logic.
 */
export enum HEDERA_TRANSACTION_MODES {
  Send = "send",
  TokenAssociate = "token-associate",
  Delegate = "delegate",
  Undelegate = "undelegate",
  Redelegate = "redelegate",
  ClaimRewards = "claim-rewards",
}

/**
 * Enum representing Hedera transaction names used in the Hedera Mirror Node API.
 */
export enum HEDERA_TRANSACTION_NAMES {
  ContractCall = "CONTRACTCALL",
  UpdateAccount = "CRYPTOUPDATEACCOUNT",
  TokenAssociate = "TOKENASSOCIATE",
}

/**
 * Enum representing the supported Hedera operation types for fee estimation
 */
export enum HEDERA_OPERATION_TYPES {
  CryptoUpdate = "CryptoUpdate",
  CryptoTransfer = "CryptoTransfer",
  TokenTransfer = "TokenTransfer",
  TokenAssociate = "TokenAssociate",
  ContractCall = "ContractCall",
}

export const HEDERA_DUMMY_ADDRESS = "0.0.163372";

export const TINYBAR_SCALE = 8;

// old value moved from https://github.com/LedgerHQ/ledger-live/blob/8447b68b7c6f1e7ccd4aa9db4da0e6c8de36a88e/libs/coin-modules/coin-hedera/src/bridge/utils.ts#L77
export const DEFAULT_TINYBAR_FEE = 150200;

export const SYNTHETIC_BLOCK_WINDOW_SECONDS = 10;

export const ESTIMATED_GAS_SAFETY_RATE = 1.2;

export const ESTIMATED_FEE_SAFETY_RATE = 2;

export const DEFAULT_GAS_LIMIT = new BigNumber(100_000);

export const DEFAULT_GAS_PRICE_TINYBARS = new BigNumber(100);

export const TRANSACTION_VALID_DURATION_SECONDS = 180;

export const HARDCODED_BLOCK_HEIGHT = 10;

/**
 * On Hedera, transactions are not appended to a global chain of immutable blocks. Instead, each consensus node
 * publishes its own transactions stream, and mirrornode publishes transactions data as it receives it from each
 * consensus node. This leads to a changing transaction history on the window [now - delay of worst node, now].
 * This delay has been empirically observed to be maximum 10 seconds (see BACK-10242).
 */
export const FINALITY_MS = 10_000;

/**
 * Enum representing the delegation status of a Hedera account
 */
export enum HEDERA_DELEGATION_STATUS {
  Inactive = "inactive",
  Overstaked = "overstaked",
  Active = "active",
}

/**
 * https://docs.hedera.com/hedera/networks/mainnet/fees
 *
 * These are Hedera's estimated fee costs in USD, scaled to tinybars (1 HBAR = 10^8 tinybars),
 * so they can be converted into actual HBAR amounts based on current USD/crypto rates.
 *
 * Used in fee estimation logic (estimateFees function) to determine whether an account
 * has sufficient balance to cover the cost of a transaction (e.g. token association).
 */
export const BASE_USD_FEE_BY_OPERATION_TYPE = {
  [HEDERA_OPERATION_TYPES.CryptoUpdate]: 0.00022 * 10 ** TINYBAR_SCALE,
  [HEDERA_OPERATION_TYPES.CryptoTransfer]: 0.0001 * 10 ** TINYBAR_SCALE,
  [HEDERA_OPERATION_TYPES.TokenTransfer]: 0.001 * 10 ** TINYBAR_SCALE,
  [HEDERA_OPERATION_TYPES.TokenAssociate]: 0.05 * 10 ** TINYBAR_SCALE,
  [HEDERA_OPERATION_TYPES.ContractCall]: 0, // Contract call fees are based on gas used and are handled separately
} as const satisfies Record<HEDERA_OPERATION_TYPES, number>;

export const MAP_STAKING_MODE_TO_MEMO: Record<string, string> = {
  [HEDERA_TRANSACTION_MODES.ClaimRewards]: "Collect Staking Rewards",
  [HEDERA_TRANSACTION_MODES.Delegate]: "Stake",
  [HEDERA_TRANSACTION_MODES.Undelegate]: "Unstake",
  [HEDERA_TRANSACTION_MODES.Redelegate]: "Restake",
} as const;

export const MAP_STAKING_MODE_TO_OPERATION_TYPE: Record<string, OperationType> = {
  [HEDERA_TRANSACTION_MODES.Delegate]: "DELEGATE",
  [HEDERA_TRANSACTION_MODES.Undelegate]: "UNDELEGATE",
  [HEDERA_TRANSACTION_MODES.Redelegate]: "REDELEGATE",
};

export const MAP_STAKING_MODE_TO_METHOD: Record<string, string> = {
  [HEDERA_TRANSACTION_MODES.Delegate]: "Delegate",
  [HEDERA_TRANSACTION_MODES.Undelegate]: "Undelegate",
  [HEDERA_TRANSACTION_MODES.Redelegate]: "Redelegate",
  [HEDERA_TRANSACTION_MODES.ClaimRewards]: "Claim Rewards",
};

/**
 * Operation types where fees should be excluded from value of native HBAR operations.
 */
export const OP_TYPES_EXCLUDING_FEES: OperationType[] = [
  "OUT",
  "DELEGATE",
  "UNDELEGATE",
  "REDELEGATE",
  "UPDATE_ACCOUNT",
  "CONTRACT_CALL",
];

/**
 * Suffix used for staking reward Ledger operations to distinguish them from operations that trigger the rewards claim.
 * Since staking rewards on Hedera are not represented as separate transactions, we need to create synthetic operations for them.
 */
export const STAKING_REWARD_HASH_SUFFIX = "-staking-reward";

export const MAP_TX_NAME_TO_CUSTOM_OPERATION_TYPE: Record<string, OperationType> = {
  [HEDERA_TRANSACTION_NAMES.TokenAssociate]: "ASSOCIATE_TOKEN",
  [HEDERA_TRANSACTION_NAMES.ContractCall]: "CONTRACT_CALL",
  [HEDERA_TRANSACTION_NAMES.UpdateAccount]: "UPDATE_ACCOUNT",
};

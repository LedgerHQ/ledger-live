/**
 * Internal types to distinguish custom Hedera transaction behaviors.
 * These can be used in transaction.mode and used to route specific preparation logic.
 */
export enum HEDERA_TRANSACTION_MODES {
  Send = "send",
  TokenAssociate = "token-associate",
}

/**
 * Enum representing the supported Hedera operation types for fee estimation
 */
export enum HEDERA_OPERATION_TYPES {
  CryptoTransfer = "CryptoTransfer",
  TokenTransfer = "TokenTransfer",
  TokenAssociate = "TokenAssociate",
}

export const TINYBAR_SCALE = 8;

export const ESTIMATED_FEE_SAFETY_RATE = 2;

// old value moved from https://github.com/LedgerHQ/ledger-live/blob/8447b68b7c6f1e7ccd4aa9db4da0e6c8de36a88e/libs/coin-modules/coin-hedera/src/bridge/utils.ts#L77
export const DEFAULT_TINYBAR_FEE = 150200;

export const SYNTHETIC_BLOCK_WINDOW_SECONDS = 10;

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
  [HEDERA_OPERATION_TYPES.CryptoTransfer]: 0.0001 * 10 ** TINYBAR_SCALE,
  [HEDERA_OPERATION_TYPES.TokenTransfer]: 0.001 * 10 ** TINYBAR_SCALE,
  [HEDERA_OPERATION_TYPES.TokenAssociate]: 0.05 * 10 ** TINYBAR_SCALE,
} as const satisfies Record<HEDERA_OPERATION_TYPES, number>;

/**
 * Internal types used to distinguish custom Hedera transaction behaviors.
 * These can be stored in transaction.properties.name and used to route specific preparation logic.
 */
export const HEDERA_TRANSACTION_KINDS = {
  TokenAssociate: {
    name: "tokenAssociate",
  },
} as const satisfies Record<string, Record<string, unknown> & { name: string }>;

/**
 * Enum representing the supported Hedera operation types for fee estimation
 */
export enum HEDERA_OPERATION_TYPES {
  CryptoTransfer = "CryptoTransfer",
  TokenTransfer = "TokenTransfer",
  TokenAssociate = "TokenAssociate",
}

const TINYBAR_SCALE = 8;

/**
 * https://docs.hedera.com/hedera/networks/mainnet/fees
 *
 * These are Hedera's estimated fee costs in USD, scaled to tinybars (1 HBAR = 10^8 tinybars),
 * so they can be converted into actual HBAR amounts based on current USD/crypto rates.
 *
 * Used in fee estimation logic (getEstimatedFees function) to determine whether an account
 * has sufficient balance to cover the cost of a transaction (e.g. token association).
 */
export const BASE_USD_FEE_BY_OPERATION_TYPE = {
  [HEDERA_OPERATION_TYPES.CryptoTransfer]: 0.0001 * 10 ** TINYBAR_SCALE,
  [HEDERA_OPERATION_TYPES.TokenTransfer]: 0.001 * 10 ** TINYBAR_SCALE,
  [HEDERA_OPERATION_TYPES.TokenAssociate]: 0.05 * 10 ** TINYBAR_SCALE,
} as const satisfies Record<HEDERA_OPERATION_TYPES, number>;

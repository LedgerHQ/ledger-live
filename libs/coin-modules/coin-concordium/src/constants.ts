import { MAX_MEMO_LENGTH, MAX_CBOR_SIZE } from "@ledgerhq/hw-app-concordium/lib/cbor";

/**
 * Concordium network chain IDs for WalletConnect protocol
 * These identify Concordium Mainnet and Testnet in WalletConnect sessions
 */
export const CONCORDIUM_CHAIN_IDS = {
  Mainnet: "ccd:9dd9ca4d19e9393877d2c44b70f89acb",
  Testnet: "ccd:4221332d34e1694168c2a0c0b3fd0f27",
} as const;

export const CONCORDIUM_ID_APP_MOBILE_HOST = "concordiumidapp://";

/**
 * Energy costs for Concordium transactions.
 * Based on: https://docs.concordium.com/en/mainnet/docs/protocol/transaction-fees.html
 *
 * Formula: energy = 100*signatureCount + (headerSize + payloadSize) + baseEnergyCost
 * - Simple transfer: 501 NRG (payload 41 bytes, base cost 300)
 * - Transfer with memo: 503 + memo_length NRG
 */
export const CONCORDIUM_ENERGY = {
  /** Fixed energy cost for simple transfers without memo */
  SIMPLE_TRANSFER: BigInt(501),
  /** Default fallback energy (same as simple transfer) */
  DEFAULT: BigInt(501),
  /** Maximum energy for TransferWithMemo: 503 (base) + 256 (max memo with CBOR) = 759 */
  TRANSFER_WITH_MEMO_MAX: BigInt(759),
  /** Default fallback cost in microCCD when estimation fails */
  DEFAULT_COST: BigInt(1000000),
} as const;

/**
 * Re-export memo size limits from hw-app-concordium
 */
export { MAX_MEMO_LENGTH, MAX_CBOR_SIZE };

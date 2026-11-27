export { MAX_MEMO_LENGTH } from "@ledgerhq/concordium-core";

/**
 * Concordium network chain IDs for WalletConnect protocol
 * These identify Concordium Mainnet and Testnet in WalletConnect sessions
 */
export const CONCORDIUM_CHAIN_IDS = {
  mainnet: "ccd:9dd9ca4d19e9393877d2c44b70f89acb",
  testnet: "ccd:4221332d34e1694168c2a0c0b3fd0f27",
} as const;

export const CONCORDIUM_ID_APP_MOBILE_HOST = "concordiumidapp://";

export const CONCORDIUM_DUMMY_ADDRESS = "3a9gh23nNY3kH4k3ajaCqAbM8rcbWMor2VhEzQ6qkn2r17UU7w";

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
} as const;

export const DEFAULT_MIN_RESERVE = 0;

export const DEFAULT_ENABLE_TOKENS = false;

export const DEFAULT_GATEWAY_TIMEOUT_MS = 30_000;

export const DEFAULT_GATEWAY_RETRIES = 2;

export const DEFAULT_GATEWAY_RETRY_DELAY_MS = 1_000;

/** The proxy's documented ceiling; anything larger is silently clamped to it. */
export const DEFAULT_MAX_TX_QUERY = 1_000;

export const DEFAULT_PLT_MODULE_STATE_CACHE_TTL_MS = 300_000;

export const DEFAULT_ACCOUNT_TOKENS_CACHE_TTL_MS = 30_000;

/** Fallback fee in microCCD when the proxy cannot estimate a CCD transfer. */
export const DEFAULT_FEES_DEFAULT_COST = 1_000_000;

/**
 * Buffer added to the energy of a PLT fee estimate, as a percentage. The fee is
 * then priced from the buffered energy rather than buffered in its own right —
 * see `estimateTokenFees`.
 *
 * Energy is a ceiling, not a charge: the chain bills actual execution, so the
 * buffer costs the user nothing while absorbing any drift between preparing the
 * transaction and submitting it.
 *
 * A percentage rather than a float multiplier because the energy is a bigint,
 * and a float would need rounding rules of its own.
 */
export const DEFAULT_PLT_ENERGY_BUFFER_PERCENT = 20;

export const DEFAULT_CAL_LOOKUP_CONCURRENCY = 4;

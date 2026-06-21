/**
 * Quantova chain constants.
 *
 * Quantova is a post-quantum Layer-1 (Substrate `stable2506-pq`). Native asset QTOV,
 * 18 decimals; testnet asset TQTOV. Addresses are Q-branded Bech32m ("Q1...") over a
 * 20-byte H160 body whose first byte is fixed to 0x40 (the "Q" brand byte).
 */

/** Native asset (mainnet) and testnet asset symbols. */
export const QTOV_SYMBOL = "QTOV";
export const TQTOV_SYMBOL = "TQTOV";

/** QTOV has 18 decimals (1 QTOV = 1e18 plancks), matching the runtime (`fees.rs`). */
export const QTOV_DECIMALS = 18;

/** Bech32m human-readable prefix. The canonical display form renders uppercase: "Q1...". */
export const QADDR_HRP = "q";

/** First byte of every account's 20-byte H160 body - the "Q" brand byte. */
export const QADDR_BRAND_BYTE = 0x40;

/** Bytes 20..32 of the 32-byte AccountId are the QVM account-mapping marker. */
export const QVM_ACCOUNT_MARKER = 0xee;

/** Generic SS58 prefix the chain advertises (chain_spec `ss58Format`). */
export const SS58_FORMAT = 42;

/**
 * Default `q_` JSON-RPC endpoints. The `q_` namespace is JSON-RPC over HTTP/WS and is
 * the canonical way to reach a Quantova node (see the developer docs, ch. 16).
 */
export const DEFAULT_NODE_ENDPOINTS = {
  mainnet: "https://mainnet.quantova.io",
  testnet: "https://testnet.quantova.io",
} as const;

/**
 * Metadata-hash (RFC-78) parameters baked into release runtimes via
 * `enable_metadata_hash("QTOV", 18)`. A device clear-signs against this digest.
 */
export const METADATA_HASH = {
  tokenSymbol: QTOV_SYMBOL,
  decimals: QTOV_DECIMALS,
} as const;

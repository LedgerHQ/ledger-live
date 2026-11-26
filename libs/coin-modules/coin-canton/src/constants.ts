export const CANTON_UNSET_RECIPIENT =
  "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

// The Canton device app rejects a node with more than 32 children, and a transfer's root node has
// 3n + 6 children for n inputs, so the device signs at most 8 inputs.
export const TO_MANY_UTXOS_CRITICAL_COUNT = 8;
export const TO_MANY_UTXOS_WARNING_COUNT = 6;

// Module defaults of the optional coin-config fields (see CantonConfig).
export const DEFAULT_USE_GATEWAY = false;
export const DEFAULT_MIN_RESERVE = 0;
export const DEFAULT_MAX_TX_QUERY = 1_000;
// The largest operations page known to pass the gateway's limit check; a larger override is clamped.
export const GATEWAY_MAX_TX_QUERY = 1_000;
export const DEFAULT_DSO_PARTY_CACHE_TTL_MS = 15 * 60 * 1000;
export const DEFAULT_PARTY_CACHE_TTL_MS = 60 * 60 * 1000;
export const DEFAULT_TOPOLOGY_CACHE_TTL_MS = 10 * 60 * 1000;
export const DEFAULT_INSTRUMENTS_CACHE_TTL_MS = 15 * 60 * 1000;
export const DEFAULT_CAL_TOKENS_CACHE_TTL_MS = 30 * 60 * 1000;

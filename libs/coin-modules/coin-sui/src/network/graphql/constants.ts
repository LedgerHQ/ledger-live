// Constants for the GraphQL transport and SUI network tests.
// Server-side limits come from the live query:
//   curl -s -X POST -H 'Content-Type: application/json' \
//     https://graphql.mainnet.sui.io/graphql \
//     -d '{"query":"{ serviceConfig { maxQueryPayloadSize maxQueryNodes maxOutputNodes } }"}'

/** Public mainnet GraphQL endpoint — default for the transport, shared by tests. */
export const GRAPHQL_MAINNET_URL = "https://graphql.mainnet.sui.io/graphql";

/**
 * Synthetic address that never holds balances or stakes. Exercises
 * the empty / zero-result paths where REST and GraphQL pagination
 * semantics tend to diverge silently.
 */
export const ACCOUNT_EMPTY = "0xdead00000000000000000000000000000000000000000000000000000000beef";

/**
 * One retry suffices: the only meaningful recovery is restart-from-
 * page-1, and a second expiry means the call can't make progress.
 */
export const MAX_CURSOR_RETRIES = 1;

/**
 * APY lookback in epochs. SUI epochs ~24 h → 30 ≈ 30 days, matching
 * Mysten's `getValidatorsApy`. Diverging would drift APY between transports.
 */
export const APY_LOOKBACK_EPOCHS = 30;

/** Page size for `STAKED_SUI_OBJECTS_BY_OWNER` — matches server default. */
export const STAKES_PAGE_SIZE = 50;

/** Per-page transaction cap for `BLOCK_BY_SEQUENCE` — server enforces ≤50. */
export const BLOCK_TXS_PAGE_SIZE = 50;

/** Per-tx event cap for `TRANSACTION_BY_DIGEST`, `TRANSACTIONS_BY_AFFECTED_ADDRESS`, `BLOCK_BY_SEQUENCE`. */
export const EVENTS_PAGE_SIZE = 50;

/**
 * Per-batch chunk for `fetchExchangeRatesBatched`. Bound by SUI's
 * undocumented limits (~5000 B payload); each alias ≈ 250 B → 15 ≈ 3.5 KB.
 */
export const RATE_BATCH_CHUNK_SIZE = 15;

/** Concurrent in-flight rate-chunk requests; bounded to avoid bursty fan-out under heavy validator sets. */
export const RATE_CHUNK_CONCURRENCY = 4;

/**
 * Hard cap on `paginateWithCursorRecovery` page walks — at `STAKES_PAGE_SIZE=50`, 100 pages
 * = 5,000 stakes/balances per address, well past any realistic wallet. Trips only on a
 * misbehaving server that keeps reporting `hasNextPage=true`.
 */
export const MAX_PAGES = 100;

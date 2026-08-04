/**
 * RTK Query reducer path for the swap aggregator — stable; it keys the store slice.
 *
 * `SWAP_API_BASE` also backs the legacy swap helpers in live-common. When those migrate to
 * `domain/api` they inject here rather than adding a `createApi`.
 */
export const SWAP_REDUCER_PATH = "swapApi";

/** Header carrying the wallet build identifier, which the aggregator logs per request. */
export const HEADER_X_LEDGER_CLIENT_VERSION = "X-Ledger-Client-Version";

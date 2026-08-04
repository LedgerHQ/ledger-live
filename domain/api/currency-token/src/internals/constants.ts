// Package-private: nothing under `internals/` is re-exported from the public barrel (`../index.ts`).

/** RTK Query cache tags for CAL token data. */
export const TOKEN_TAGS = ["Tokens"] as const;

/** Default page size for the paginated `getTokensData` query. */
export const DEFAULT_PAGE_SIZE = 1000;

/** Response header holding the CAL commit hash, used for token-cache invalidation. */
export const HEADER_X_LEDGER_COMMIT = "X-Ledger-Commit";

/** Response header carrying the pagination cursor for the next page. */
export const HEADER_X_LEDGER_NEXT = "x-ledger-next";

/** Persisted-cache format version. Bump to invalidate older blobs (pinned via `z.literal`). */
export const PERSISTENCE_VERSION = 2;

/** Matches an RTK Query `getTokensSyncHash` cache key, capturing the currency id. */
export const SYNC_HASH_QUERY_KEY = /getTokensSyncHash\("([^"]+)"\)/;

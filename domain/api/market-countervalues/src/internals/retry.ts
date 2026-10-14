// Request policy for the countervalues endpoints.
//
// The shared Countervalues base query wraps `retry` with `maxRetries: 3` and RTK's default
// condition, which retries everything. The rate fetches did not go through it before: they went
// through `@ledgerhq/live-network`, whose GET path retries `getCallsRetry` (2) times and skips any
// status outside the list below, 422 among them. Per-pair backoff in `loadCountervalues` has always
// counted one logical failure on top of that layer, so zeroing retries here would not restore a
// status quo, it would make the backoff advance about three times faster on transient errors.
// This mirrors the old policy instead.

import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";

/** Mirrors `retryableHttpStatusCodes` in `@ledgerhq/live-network`. */
const RETRYABLE_HTTP_STATUS = new Set([408, 413, 429, 500, 502, 503, 504, 521, 522, 524]);

/** Mirrors `getCallsRetry`, whose default is 2. */
const MAX_RETRIES = 2;

function isRetryable(error: FetchBaseQueryError | SerializedError): boolean {
  if (!("status" in error)) return true;
  const { status } = error;
  if (typeof status === "number") return RETRYABLE_HTTP_STATUS.has(status);
  // A schema failure lands as CUSTOM_ERROR and a bad payload as PARSING_ERROR. Neither is fixed by
  // asking again, and axios never retried them either.
  return status === "FETCH_ERROR" || status === "TIMEOUT_ERROR";
}

/** Mirrors `getCallsTimeout`, whose default is 60s. Without it a hung request never settles. */
export const RATE_REQUEST_TIMEOUT_MS = 60_000;

/** For the endpoints moved from live-common's client, which never retried. */
export const noRetryOptions = { maxRetries: 0 };

/** Per-endpoint retry options for the rate fetches. Overrides the shared base query's `retry(3)`. */
export const rateFetchRetryOptions = {
  maxRetries: MAX_RETRIES,
  retryCondition: (
    error: FetchBaseQueryError,
    _args: unknown,
    { attempt }: { attempt: number },
  ): boolean => attempt <= MAX_RETRIES && isRetryable(error),
};

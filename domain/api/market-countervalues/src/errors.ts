import type { SerializedError } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

/**
 * A failed rate request, carrying RTK Query's `status` **verbatim**.
 *
 * The distinction the countervalues backoff rests on is already in that envelope: an HTTP response
 * gives a numeric status, a dead connection gives `"FETCH_ERROR"`. `loadCountervalues` counts a
 * failure only for a numeric status and wipes a pair's cache only on 422, so translating these into
 * a coarser taxonomy (as `remapRtkQueryError` does, collapsing every 4xx together) would silently
 * lose both behaviours. Nothing is mapped here on purpose.
 */
export class RateFetchError extends Error {
  readonly status?: number | string;

  constructor(error: FetchBaseQueryError | SerializedError) {
    const status = "status" in error ? error.status : undefined;
    super(describe(error, status));
    this.name = "RateFetchError";
    this.status = status;
  }
}

function describe(
  error: FetchBaseQueryError | SerializedError,
  status: number | string | undefined,
): string {
  if (status === undefined) return error.message ?? "Unknown rate fetch error";
  return `Rate fetch failed with status ${status}`;
}

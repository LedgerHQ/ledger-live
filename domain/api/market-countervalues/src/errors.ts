import type { SerializedError } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

/**
 * A failed rate request, carrying RTK Query's `status` **verbatim**.
 *
 * The distinction the countervalues backoff rests on is already in that envelope: an HTTP response
 * gives a numeric status, a dead connection gives `"FETCH_ERROR"`. `loadCountervalues` counts a
 * failure only for a numeric status and wipes a pair's cache only on 422, so translating these
 * into a coarser taxonomy would silently lose both behaviours. `remapRtkQueryError` does exactly
 * that, collapsing every 4xx together. Nothing is mapped here on purpose.
 */
export class RateFetchError extends Error {
  readonly status?: number | string;

  constructor(error: FetchBaseQueryError | SerializedError) {
    if ("status" in error) {
      super(`Rate fetch failed with status ${error.status}`);
      this.status = error.status;
    } else {
      super(error.message ?? "Unknown rate fetch error");
    }
    this.name = "RateFetchError";
  }
}

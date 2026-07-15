import type { FetchBaseQueryError } from "@reduxjs/toolkit/query/react";

/** Shape of an error result returned from a `queryFn`. */
type QueryFnError = { error: FetchBaseQueryError };

/** The CAL request returned a non-OK HTTP status. */
export function fetchCurrencyError(status: number, statusText: string): QueryFnError {
  return {
    error: { status, data: `Failed to fetch currency: ${statusText}` },
  };
}

/** No currency matched the requested id (CAL returned an empty list). */
export function currencyNotFoundError(currencyId: string): QueryFnError {
  return {
    error: { status: 404, data: `Currency not found: ${currencyId}` },
  };
}

/** The CAL response was missing the `X-Ledger-Commit` header. */
export function commitHeaderMissingError(): QueryFnError {
  const message = "X-Ledger-Commit header not found in response";
  return {
    error: { status: "PARSING_ERROR", data: message, error: message, originalStatus: 200 },
  };
}

/** A network or unknown failure while fetching the sync hash. */
export function fetchError(error: unknown): QueryFnError {
  return {
    error: {
      status: "FETCH_ERROR",
      error: error instanceof Error ? error.message : "Unknown error",
    },
  };
}

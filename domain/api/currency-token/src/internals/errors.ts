import type { FetchBaseQueryError } from "@reduxjs/toolkit/query/react";

/** Shape of an error result returned from a `queryFn`. */
type QueryFnError = { error: FetchBaseQueryError };

/** No currency matched the requested id (CAL returned an empty list). */
export function currencyNotFoundError(currencyId: string): QueryFnError {
  return {
    error: { status: 404, data: `Currency not found: ${currencyId}` },
  };
}

/** True when `error` is the 404 result from {@link currencyNotFoundError}. */
export function isCurrencyNotFoundError(error: unknown, currencyId: string): boolean {
  if (!error || typeof error !== "object" || !("status" in error) || !("data" in error)) {
    return false;
  }
  const expected = currencyNotFoundError(currencyId).error;
  return error.status === expected.status && error.data === expected.data;
}

/** The CAL response was missing the `X-Ledger-Commit` header. */
export function commitHeaderMissingError(): QueryFnError {
  const message = "X-Ledger-Commit header not found in response";
  return {
    error: { status: "PARSING_ERROR", data: message, error: message, originalStatus: 200 },
  };
}

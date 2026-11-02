import type { FetchBaseQueryError } from "@reduxjs/toolkit/query/react";

/** Shape of an error result returned from a `queryFn`. */
type QueryFnError = { error: FetchBaseQueryError };

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

/** No network matched the requested id (CAL returned an empty list). */
export function networkNotFoundError(currencyId: string): QueryFnError {
  return {
    error: { status: 404, data: `Network not found: ${currencyId}` },
  };
}

/** The CAL `/v1/networks` response did not match its schema. */
export function invalidNetworkResponseError(): QueryFnError {
  const message = "Invalid /v1/networks response";
  return {
    error: { status: "PARSING_ERROR", data: message, error: message, originalStatus: 200 },
  };
}

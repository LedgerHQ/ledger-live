import type { BaseQueryApi, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";

/** The HTTP status, including the one `fetchBaseQuery` hides behind `PARSING_ERROR`. */
function httpStatus(error: FetchBaseQueryError): number | undefined {
  if (typeof error.status === "number") return error.status;
  if (error.status === "PARSING_ERROR") return error.originalStatus;
  return undefined;
}

/**
 * Only a query is sent again, whatever its HTTP method, and never a mutation. It is sent again only
 * after a failure that may pass: the network or a 5xx. A 4xx would fail the same way, and a timeout
 * is left to the caller, which polls.
 */
export function shouldRetryEarnRequest(
  error: FetchBaseQueryError,
  requestType: BaseQueryApi["type"],
): boolean {
  if (requestType !== "query") return false;
  if (error.status === "FETCH_ERROR") return true;
  const status = httpStatus(error);
  return status !== undefined && status >= 500;
}

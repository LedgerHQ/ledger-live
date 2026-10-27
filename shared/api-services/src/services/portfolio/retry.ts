import type { FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";

function requestMethod(request: string | FetchArgs): string {
  if (typeof request === "string") return "GET";
  return (request.method ?? "GET").toUpperCase();
}

/** The HTTP status, including the one `fetchBaseQuery` hides behind `PARSING_ERROR`. */
function httpStatus(error: FetchBaseQueryError): number | undefined {
  if (typeof error.status === "number") return error.status;
  if (error.status === "PARSING_ERROR" && typeof error.originalStatus === "number") {
    return error.originalStatus;
  }
  return undefined;
}

/**
 * Only a read is sent again, and only when the failure may pass: a mutation is never repeated, and
 * a 4xx would fail the same way. A non-JSON body keeps its HTTP status on `originalStatus`.
 */
export function shouldRetry(error: FetchBaseQueryError, request: string | FetchArgs): boolean {
  if (requestMethod(request) !== "GET") return false;
  const status = httpStatus(error);
  return status === undefined || status >= 500;
}

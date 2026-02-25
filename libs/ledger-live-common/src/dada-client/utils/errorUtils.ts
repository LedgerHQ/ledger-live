import { FetchBaseQueryError } from "@reduxjs/toolkit/query";

/**
 * Type guard to check if error is a FetchBaseQueryError
 */
export function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === "object" && error !== null && "status" in error;
}

/**
 * Check if the error is a network connectivity error (no internet, timeout, etc.)
 */
export function isNetworkError(error: unknown): boolean {
  if (!isFetchBaseQueryError(error)) {
    return false;
  }
  return error.status === "FETCH_ERROR" || error.status === "TIMEOUT_ERROR";
}

/**
 * Check if the error is an API error with HTTP status code (4xx, 5xx)
 */
export function isApiError(error: unknown): boolean {
  if (!isFetchBaseQueryError(error)) {
    return false;
  }
  return typeof error.status === "number";
}

/**
 * Get HTTP status code from API error, or undefined if not an API error
 */
export function getApiErrorStatus(error: unknown): number | undefined {
  if (!isFetchBaseQueryError(error) || typeof error.status !== "number") {
    return undefined;
  }
  return error.status;
}

export type ErrorInfo = {
  hasError: boolean;
  isNetworkError: boolean;
  isApiError: boolean;
  apiStatus: number | undefined;
};

/**
 * Parse error into a structured ErrorInfo object
 */
export function parseError(error: unknown): ErrorInfo {
  return {
    hasError: !!error,
    isNetworkError: isNetworkError(error),
    isApiError: isApiError(error),
    apiStatus: getApiErrorStatus(error),
  };
}

/**
 * Check if an error has the shape of an Axios rate limit error
 *
 * @param error the error to check
 * @returns true if error is a rate limit otherwise false
 */
export function isHttpRateLimitError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "status" in error.response &&
      error.response.status === 429,
  );
}

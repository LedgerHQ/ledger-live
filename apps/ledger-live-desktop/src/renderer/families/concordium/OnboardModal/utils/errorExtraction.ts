/**
 * Utility functions for extracting error information from unknown error objects.
 */

/**
 * Safely extracts an error message from an unknown error value.
 *
 * @param error - The error value to extract a message from
 * @returns A string error message, never undefined
 */
export function extractErrorMessage(error: unknown): string {
  const DEFAULT_MESSAGE = "Unknown error occurred";

  if (error instanceof Error) {
    return error.message || DEFAULT_MESSAGE;
  }

  if (typeof error === "string") {
    return error || DEFAULT_MESSAGE;
  }

  if (typeof error === "object" && error != null) {
    if ("message" in error && typeof error.message === "string") {
      return error.message || DEFAULT_MESSAGE;
    }
    if (error.toString !== Object.prototype.toString) {
      const str = error.toString();
      if (str) return str;
    }
    return DEFAULT_MESSAGE;
  }

  return error != null ? String(error) : DEFAULT_MESSAGE;
}

/**
 * Converts an unknown error value to an Error object.
 *
 * @param error - The error value to convert
 * @returns An Error object
 */
export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  const message = extractErrorMessage(error);
  const err = new Error(message);

  if (
    typeof error === "object" &&
    error !== null &&
    "stack" in error &&
    typeof error.stack === "string"
  ) {
    err.stack = error.stack;
  }

  return err;
}

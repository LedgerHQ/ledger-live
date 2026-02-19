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
  if (error == null) {
    return "Unknown error occurred";
  }

  if (error instanceof Error) {
    return error.message || "Unknown error occurred";
  }

  if (
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.length > 0
  ) {
    return error.message;
  }

  if (typeof error === "string" && error.length > 0) {
    return error;
  }

  try {
    const str = String(error);
    return str && str !== "[object Object]" ? str : "Unknown error occurred";
  } catch {
    return "Unknown error occurred";
  }
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

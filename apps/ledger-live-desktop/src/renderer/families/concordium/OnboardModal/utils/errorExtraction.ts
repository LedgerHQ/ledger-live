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
  // Handle null/undefined
  if (error == null) {
    return "Unknown error occurred";
  }

  // Handle Error objects
  if (error instanceof Error) {
    return error.message || "Unknown error occurred";
  }

  // Handle objects with message property
  if (
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.length > 0
  ) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === "string" && error.length > 0) {
    return error;
  }

  // Fallback: stringify the error
  try {
    const stringified = String(error);
    if (!stringified || stringified === "[object Object]") {
      return "Unknown error occurred";
    }
    return stringified;
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

  // Preserve stack trace if available
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

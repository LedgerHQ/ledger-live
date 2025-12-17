/**
 * Error Handler
 * Decides how to handle errors - display to user, mark as handled, or throw
 */

import { SwapError } from "./SwapError";

/**
 * Interface for error handler options
 */
export interface ErrorHandlerOptions {
  /**
   * Callback to display error to user (optional)
   * If not provided, errors are simply thrown
   */
  onDisplayError?: (error: SwapError) => Promise<void>;

  /**
   * Additional error names to ignore (won't be displayed)
   */
  ignoredErrorNames?: string[];

  /**
   * Additional error messages to ignore (won't be displayed)
   */
  ignoredMessages?: string[];
}

/**
 * Default error names that should be marked as "handled"
 * These are typically user input errors that can be retried
 */
const DEFAULT_IGNORED_ERROR_NAMES = new Set([
  "WrongDeviceForAccount",
  "WrongDeviceForAccountPayout",
  "WrongDeviceForAccountRefund",
  "UserRefusedOnDevice",
]);

/**
 * Default error messages that should be marked as "handled"
 */
const DEFAULT_IGNORED_MESSAGES = new Set(["User refused", "User rejected"]);

type SwapErrorCauseDetails = {
  swapCode?: string;
  name?: string;
  message?: string;
};

type ErrorWithCause = Error & { cause?: unknown };
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasCause(value: Error): value is ErrorWithCause {
  return "cause" in value;
}

function toCauseDetails(rawCause: unknown): SwapErrorCauseDetails | undefined {
  if (!isRecord(rawCause)) {
    return undefined;
  }

  const swapCode = typeof rawCause.swapCode === "string" ? rawCause.swapCode : undefined;
  const name = typeof rawCause.name === "string" ? rawCause.name : undefined;
  const message = typeof rawCause.message === "string" ? rawCause.message : undefined;

  if (swapCode || name || message) {
    return { swapCode, name, message };
  }

  return undefined;
}

function extractErrorDetails(value: unknown): {
  message: string;
  cause?: SwapErrorCauseDetails;
} {
  if (value instanceof SwapError) {
    return { message: value.message, cause: value.cause };
  }

  if (value instanceof Error) {
    return {
      message: value.message,
      cause: hasCause(value) ? toCauseDetails(value.cause) : undefined,
    };
  }

  if (isRecord(value) && typeof value.message === "string") {
    const rawCause = "cause" in value ? value.cause : undefined;
    const cause = toCauseDetails(rawCause);
    return { message: value.message, cause };
  }

  return { message: typeof value === "string" ? value : JSON.stringify(value ?? "Unknown error") };
}

function markErrorAsHandled<T>(error: T): T {
  if (isRecord(error)) {
    Object.assign(error, { handled: true });
  }

  return error;
}

/**
 * Handles errors by deciding whether to display them or mark as handled
 *
 * @param error - The error to handle
 * @param options - Configuration options
 * @throws Enhanced error with `handled` flag if applicable
 */
export function handleErrors(error: unknown, options: ErrorHandlerOptions = {}): Promise<void> {
  const { onDisplayError, ignoredErrorNames = [], ignoredMessages = [] } = options;

  // Merge default and custom ignored values
  const allIgnoredNames = new Set([...DEFAULT_IGNORED_ERROR_NAMES, ...ignoredErrorNames]);

  const allIgnoredMessages = new Set([...DEFAULT_IGNORED_MESSAGES, ...ignoredMessages]);

  const { message, cause } = extractErrorDetails(error);

  // Check if error should be marked as handled (retry-ready)
  const isIgnoredMessage = allIgnoredMessages.has(message);
  const isIgnoredName = typeof cause?.name === "string" && allIgnoredNames.has(cause.name);
  const isIgnoredSwapCode = cause?.swapCode === "swap003Ignored";

  if (isIgnoredMessage || isIgnoredName || isIgnoredSwapCode) {
    throw markErrorAsHandled(error);
  }

  // Display error to user if handler provided
  if (error instanceof SwapError && onDisplayError) {
    // Skip displaying "swap003Ignored" errors
    if (cause?.swapCode !== "swap003Ignored") {
      return onDisplayError(error);
    }
  }

  // Always throw the error so caller can handle it
  throw error;
}

/**
 * Type guard to check if an error is marked as handled
 */
export function isHandledError(error: unknown): boolean {
  return isRecord(error) && error.handled === true;
}

/**
 * Extracts swap code from error if available
 */
export function getSwapCode(error: unknown): string | undefined {
  if (error instanceof SwapError) {
    return error.cause.swapCode;
  }
  return undefined;
}

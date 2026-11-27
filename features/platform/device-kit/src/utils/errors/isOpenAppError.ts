import { someNestedError } from "./internals";

/** An app rejects the OS commands it does not know, so these mean an app answered instead of the OS. */
export const CLA_NOT_SUPPORTED_STATUS_WORD = "6e00";
export const INS_NOT_SUPPORTED_STATUS_WORD = "6d00";

const OPEN_APP_STATUS_WORDS = new Set([
  CLA_NOT_SUPPORTED_STATUS_WORD,
  INS_NOT_SUPPORTED_STATUS_WORD,
]);

function toStatusWord(statusCode: unknown): string | null {
  if (!(statusCode instanceof Uint8Array) || statusCode.length < 2) {
    return null;
  }
  return Array.from(statusCode.slice(0, 2), byte => byte.toString(16).padStart(2, "0")).join("");
}

export function isOpenAppError(error: unknown): boolean {
  return someNestedError(
    error,
    current =>
      ("errorCode" in current &&
        typeof current.errorCode === "string" &&
        OPEN_APP_STATUS_WORDS.has(current.errorCode)) ||
      ("statusCode" in current &&
        OPEN_APP_STATUS_WORDS.has(toStatusWord(current.statusCode) ?? "")),
  );
}

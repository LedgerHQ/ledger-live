import { keyRingErrorForDisplay } from "@features/platform-key-ring";
import { ErrorType } from "../hooks/type.hooks";

export const isNoTrustchainError = (error: Error) =>
  error.message.includes(ErrorType.NO_TRUSTCHAIN);

export const isUnauthorizedMemberError = (error: Error) =>
  error.name === "LedgerAPI4xx" &&
  (error.message.includes("Not a member of trustchain") ||
    error.message.includes("You are not member"));

/** `keyRingErrorForDisplay`, typed for the error views: an `Error` in, an `Error` out. */
export function keyRingErrorForDisplayView(error: Error): Error {
  const displayed = keyRingErrorForDisplay(error);
  return displayed instanceof Error ? displayed : error;
}

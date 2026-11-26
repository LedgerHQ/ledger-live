import { classifyKeyRingError, keyRingErrorForDisplay } from "@features/platform-key-ring";
import type { LedgerSyncDeviceFailure } from "../types";

/**
 * Messages the Ledger Sync error recovery matches with `includes`. `membersDataUndefined` is the
 * error the members query reports when it resolves nothing for a session without a key tree
 * stream.
 */
export const LedgerSyncErrorMessage = Object.freeze({
  noTrustchain: "No such trustchain",
  membersDataUndefined: '["useGetMembers",null] data is undefined',
} as const);

/**
 * The error an error screen shows for a Ledger Sync failure, with its existing translation: the
 * `keyRingErrorForDisplay` of `@features/platform-key-ring`, typed `Error` in and out.
 *
 * @example
 * ```tsx
 * <ErrorDisplay error={ledgerSyncErrorForDisplay(error)} onRetry={onRetry} />
 * ```
 */
export function ledgerSyncErrorForDisplay(error: Error): Error {
  const displayed = keyRingErrorForDisplay(error);
  return displayed instanceof Error ? displayed : error;
}

/** True when the backend reports that the key tree does not exist. */
export function isNoTrustchainError(error: Error): boolean {
  return error.message.includes(LedgerSyncErrorMessage.noTrustchain);
}

/** True when the backend refuses this instance because it is not a member of the key tree. */
export function isUnauthorizedMemberError(error: Error): boolean {
  return (
    error.name === "LedgerAPI4xx" &&
    (error.message.includes("Not a member of trustchain") ||
      error.message.includes("You are not member"))
  );
}

/**
 * Why a legacy (non-DIE) activation or removal failed, for the app to pick its screen. Every
 * category other than the ones the apps branch on is `other`.
 */
export function classifyLedgerSyncDeviceFailure(error: unknown): LedgerSyncDeviceFailure {
  const category = classifyKeyRingError(error);
  return category && DEVICE_FAILURES.has(category)
    ? (category as LedgerSyncDeviceFailure)
    : "other";
}

const DEVICE_FAILURES: ReadonlySet<string> = new Set<LedgerSyncDeviceFailure>([
  "already-member",
  "member-of-other-tree",
  "not-allowed",
  "no-tree-for-seed",
  "user-refused",
]);

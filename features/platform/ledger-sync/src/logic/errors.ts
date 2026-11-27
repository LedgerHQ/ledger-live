import { classifyKeyRingError, keyRingErrorForDisplay } from "@features/platform-key-ring";
import type { LedgerSyncDeviceFailure } from "../types";

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

/**
 * True when the backend no longer has the key tree this instance is a member of: a
 * `tree-not-found` error while the store still holds a key tree. Without one, the instance has no
 * key tree to lose: the error comes from a call made without a key tree, not from the backend.
 *
 * @example
 * ```ts
 * const isMember = useSelector(selectIsKeyRingMember);
 * if (error && !isLedgerSyncTreeGone(error, isMember)) showAlert(error);
 * ```
 */
export function isLedgerSyncTreeGone(error: unknown, isKeyRingMember: boolean): boolean {
  return isKeyRingMember && classifyKeyRingError(error) === "tree-not-found";
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
  "device-unsupported",
]);

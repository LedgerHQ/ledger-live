import { getErrorName, toError } from "./internals/errors";

export type LedgerSyncFailureReason =
  | "already-secured-same-seed"
  | "already-secured-other-seed"
  | "not-allowed"
  | "no-trustchain"
  | "unknown";

export type LedgerSyncFailureJobState = {
  readonly type: "failed";
  readonly reason: LedgerSyncFailureReason;
  readonly error: Error;
};

export type LedgerSyncDeviceRejectedJobState = {
  readonly type: "device-rejected";
  readonly error: Error;
  /** Re-runs the SDK call on the same DIE session. */
  readonly retry: () => void;
};

const FAILURE_REASON_BY_ERROR_NAME: ReadonlyMap<string, LedgerSyncFailureReason> = new Map([
  ["TrustchainAlreadyInitialized", "already-secured-same-seed"],
  ["TrustchainAlreadyInitializedWithOtherSeed", "already-secured-other-seed"],
  ["TrustchainNotAllowed", "not-allowed"],
  ["NoTrustchainInitialized", "no-trustchain"],
]);

/** Matches on `error.name`, as the apps do today; `UserRefusedOnDevice` maps to device-rejected, not here. */
export function mapLedgerSyncErrorToFailure(error: unknown): LedgerSyncFailureJobState {
  const name = getErrorName(error);
  const reason = (name && FAILURE_REASON_BY_ERROR_NAME.get(name)) || "unknown";
  return { type: "failed", reason, error: toError(error) };
}

export function isUserRefusedOnDevice(error: unknown): boolean {
  return getErrorName(error) === "UserRefusedOnDevice";
}

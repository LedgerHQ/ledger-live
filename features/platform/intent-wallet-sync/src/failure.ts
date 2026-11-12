import type { LedgerSyncFailureJobState, LedgerSyncFailureReason } from "./jobState";
import { getErrorName, toError } from "./internals/errors";

const FAILURE_REASON_BY_ERROR_NAME: ReadonlyMap<string, LedgerSyncFailureReason> = new Map([
  ["TrustchainAlreadyInitialized", "already-secured-same-seed"],
  ["TrustchainAlreadyInitializedWithOtherSeed", "already-secured-other-seed"],
  ["TrustchainNotAllowed", "not-allowed"],
  ["NoTrustchainInitialized", "no-trustchain"],
]);

/**
 * Turns an error thrown by the Ledger Sync SDK into the terminal `failed` state.
 *
 * Matches on `error.name`, not on the class, so an error that lost its prototype (serialized
 * across a bridge, or thrown by another copy of the SDK) still maps to its reason. Any other
 * error maps to `unknown`. Call {@link isUserRefusedOnDevice} first: a refusal is not a failure.
 */
export function mapLedgerSyncErrorToFailure(error: unknown): LedgerSyncFailureJobState {
  const name = getErrorName(error);
  const reason = (name && FAILURE_REASON_BY_ERROR_NAME.get(name)) || "unknown";
  return { type: "failed", reason, error: toError(error) };
}

/**
 * Whether the user refused the request on the device, which the job reports as
 * `device-rejected` so the app can offer a retry.
 */
export function isUserRefusedOnDevice(error: unknown): boolean {
  return getErrorName(error) === "UserRefusedOnDevice";
}

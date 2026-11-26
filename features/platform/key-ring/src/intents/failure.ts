import type { LedgerSyncFailureJobState, LedgerSyncFailureReason } from "./jobState";
import type { KeyRingErrorCategory } from "../types";
import { classifyKeyRingError } from "../errors";
import { toError } from "../internals/errors";

/**
 * Turns an error thrown by a key ring operation into the terminal `failed` state.
 *
 * Classifies the error by category, so an error that lost its prototype (serialized across a
 * bridge, or thrown by another copy of the SDK) still maps to its reason. Any other error maps
 * to `unknown`. Call {@link isUserRefusedOnDevice} first: a refusal is not a failure.
 */
export function mapLedgerSyncErrorToFailure(error: unknown): LedgerSyncFailureJobState {
  const category = classifyKeyRingError(error);
  const reason = (category && FAILURE_REASON_BY_CATEGORY.get(category)) || "unknown";
  return { type: "failed", reason, error: toError(error) };
}

/**
 * Whether the user refused the request on the device, which the job reports as
 * `device-rejected` so the app can offer a retry.
 */
export function isUserRefusedOnDevice(error: unknown): boolean {
  return classifyKeyRingError(error) === "user-refused";
}

const FAILURE_REASON_BY_CATEGORY: ReadonlyMap<KeyRingErrorCategory, LedgerSyncFailureReason> =
  new Map([
    ["already-member", "already-secured-same-seed"],
    ["member-of-other-tree", "already-secured-other-seed"],
    ["not-allowed", "not-allowed"],
    ["no-tree-for-seed", "no-trustchain"],
  ]);

import type { LedgerSyncFailureJobState, LedgerSyncFailureReason } from "./jobState";
import type { KeyRingDeviceInitialization, KeyRingErrorCategory } from "../types";
import { classifyKeyRingError, KeyRingDeviceUnsupportedError } from "../errors";
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
 * The terminal `failed` state, with the `device-unsupported` reason, of a run whose device
 * initialization is an OS feature the DIE input cannot express yet. The app reports it in place
 * of starting the executor, where it would report any other failure.
 *
 * @example
 * ```ts
 * if (initialization.kind === "os-feature") {
 *   intent.onJobStateChanged?.(ledgerSyncDeviceUnsupportedFailure(initialization));
 * }
 * ```
 */
export function ledgerSyncDeviceUnsupportedFailure(
  initialization: Extract<KeyRingDeviceInitialization, { kind: "os-feature" }>,
): LedgerSyncFailureJobState {
  const minimum = initialization.minimumOsVersion
    ? ` from OS ${initialization.minimumOsVersion}`
    : "";
  return mapLedgerSyncErrorToFailure(
    new KeyRingDeviceUnsupportedError(`The device needs ${initialization.feature}${minimum}`),
  );
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
    ["device-unsupported", "device-unsupported"],
  ]);

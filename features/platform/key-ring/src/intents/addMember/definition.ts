import { addMemberIntentJob } from "./job";
import type { AddMemberIntentDefinition } from "./types";

/**
 * Adds this instance to the key tree of the device seed.
 *
 * `requiresConnectedDevice`: the device signs the member in. `delegateDeviceLockStateHandlingToExecutor`:
 * DIE handles the device locking or unlocking during the run, so the job does not. Apps spread it into
 * their platform definition and add their `component`.
 *
 * @example
 * ```ts
 * const addMemberIntentLWMDefinition: AddMemberIntentPlatformDefinition = {
 *   ...addMemberIntentDefinition,
 *   component: AddMemberComponentLWM,
 * };
 *
 * const intent = createIntent(
 *   addMemberIntentLWMDefinition,
 *   { session, client: keyRing, resultOrder: ledgerSyncResultOrder },
 *   {
 *     onResult: activation =>
 *       dispatch(acceptLedgerSyncResult(commitKeyRingTree(activation.tree), session)),
 *   },
 * );
 * ```
 */
export const addMemberIntentDefinition: AddMemberIntentDefinition = {
  label: "Ledger Sync add member",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: true,
  job: addMemberIntentJob,
};

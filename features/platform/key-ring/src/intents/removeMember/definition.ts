import { removeMemberIntentJob } from "./job";
import type { RemoveMemberIntentDefinition } from "./types";

/**
 * Removes another instance from the key tree.
 *
 * `requiresConnectedDevice`: the device signs the key rotation. `delegateDeviceLockStateHandlingToExecutor`:
 * DIE handles the device locking or unlocking during the run, so the job does not. Apps spread it into
 * their platform definition and add their `component`.
 *
 * @example
 * ```ts
 * const removeMemberIntentLWMDefinition: RemoveMemberIntentPlatformDefinition = {
 *   ...removeMemberIntentDefinition,
 *   component: RemoveMemberComponentLWM,
 * };
 *
 * const intent = createIntent(
 *   removeMemberIntentLWMDefinition,
 *   { session, member, client: keyRing, resultOrder: ledgerSyncResultOrder },
 *   { onResult: tree => dispatch(acceptLedgerSyncResult(commitKeyRingTree(tree), session)) },
 * );
 * ```
 */
export const removeMemberIntentDefinition: RemoveMemberIntentDefinition = {
  label: "Ledger Sync remove member",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: true,
  job: removeMemberIntentJob,
};

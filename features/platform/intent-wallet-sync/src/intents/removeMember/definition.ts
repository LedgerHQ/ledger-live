import { removeMemberIntentJob } from "./job";
import type { RemoveMemberIntentDefinition } from "./types";

/**
 * Removes another instance from the Ledger Sync trustchain.
 *
 * `requiresConnectedDevice`: the device signs the key rotation. `delegateDeviceLockStateHandlingToExecutor`:
 * DIE handles the device locking or unlocking during the run, so the job does not. Apps spread it into
 * their platform definition and add their `component`.
 */
export const removeMemberIntentDefinition: RemoveMemberIntentDefinition = {
  label: "Ledger Sync remove member",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: true,
  job: removeMemberIntentJob,
};

import { addMemberIntentJob } from "./job";
import type { AddMemberIntentDefinition } from "./types";

/**
 * Adds this instance to the Ledger Sync trustchain of the device seed.
 *
 * `requiresConnectedDevice`: the device signs the member in. `delegateDeviceLockStateHandlingToExecutor`:
 * DIE handles the device locking or unlocking during the run, so the job does not. Apps spread it into
 * their platform definition and add their `component`.
 */
export const addMemberIntentDefinition: AddMemberIntentDefinition = {
  label: "Ledger Sync add member",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: true,
  job: addMemberIntentJob,
};

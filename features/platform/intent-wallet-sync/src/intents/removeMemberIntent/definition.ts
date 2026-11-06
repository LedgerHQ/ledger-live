import { removeMemberIntentJob } from "./job";
import type { RemoveMemberIntentDefinition } from "./types";

export const removeMemberIntentDefinition: RemoveMemberIntentDefinition = {
  label: "Ledger Sync remove member",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: true,
  job: removeMemberIntentJob,
};

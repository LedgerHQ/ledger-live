import { addMemberIntentJob } from "./job";
import type { AddMemberIntentDefinition } from "./types";

export const addMemberIntentDefinition: AddMemberIntentDefinition = {
  label: "Ledger Sync add member",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: true,
  job: addMemberIntentJob,
};

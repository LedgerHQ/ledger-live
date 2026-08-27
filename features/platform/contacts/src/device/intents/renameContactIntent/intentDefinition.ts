import { renameContactIntentJob } from "./job";
import type { RenameContactIntentDefinition } from "./types";

export const renameContactIntentDefinition: RenameContactIntentDefinition = {
  label: "Rename contact",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: true,
  job: renameContactIntentJob,
};

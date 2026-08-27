import { RenameContactComponent } from "./component";
import { renameContactIntentJob } from "./job";
import type { RenameContactIntentPlatformDefinition } from "./types";

export const renameContactIntentPlatformDefinition: RenameContactIntentPlatformDefinition = {
  label: "Rename contact",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: true,
  job: renameContactIntentJob,
  component: RenameContactComponent,
};

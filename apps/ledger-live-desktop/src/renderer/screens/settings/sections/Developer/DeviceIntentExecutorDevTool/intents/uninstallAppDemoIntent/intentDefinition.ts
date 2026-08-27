import { type UninstallAppDemoIntentDefinition } from "./types";
import { uninstallAppDemoIntentJob } from "./job";

export const uninstallAppDemoIntentDefinition: UninstallAppDemoIntentDefinition = {
  label: "Uninstall App",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: uninstallAppDemoIntentJob,
};

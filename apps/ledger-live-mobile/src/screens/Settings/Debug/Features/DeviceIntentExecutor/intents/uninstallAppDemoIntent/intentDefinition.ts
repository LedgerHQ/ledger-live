import { type UninstallAppDemoIntentDefinition } from "./types";
import { uninstallAppDemoIntentJob } from "./job";

/**
 * Prompts the user to confirm or skip, then runs a DMK `UninstallAppDeviceAction`.
 * Demonstrates user interactivity within a job (confirm/skip callbacks embedded in the
 * emitted job state), wrapping a DMK device action with `defer`/`pipe` operators,
 * and displaying a terminal success/failure state for a fixed duration before completing.
 */
export const uninstallAppDemoIntentDefinition: UninstallAppDemoIntentDefinition = {
  label: "Uninstall App",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: uninstallAppDemoIntentJob,
};

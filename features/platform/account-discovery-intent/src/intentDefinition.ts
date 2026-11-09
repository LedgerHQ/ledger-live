import { accountDiscoveryIntentJob } from "./job";
import type { AccountDiscoveryIntentDefinition } from "./types";

/** The executor keeps handling the device lock: the scan has no state of its own for it. */
export const accountDiscoveryIntentDefinition: AccountDiscoveryIntentDefinition = {
  label: "Discover accounts",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: true,
  job: accountDiscoveryIntentJob,
};

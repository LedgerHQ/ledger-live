import { registerExternalAddressIntentJob } from "./job";
import type { RegisterExternalAddressIntentDefinition } from "./types";

export const registerExternalAddressIntentDefinition: RegisterExternalAddressIntentDefinition = {
  label: "Register external address",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: true,
  job: registerExternalAddressIntentJob,
};

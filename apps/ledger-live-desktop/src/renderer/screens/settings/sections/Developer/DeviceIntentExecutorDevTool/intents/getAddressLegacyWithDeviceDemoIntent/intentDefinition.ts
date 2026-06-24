import { type GetAddressLegacyWithDeviceDemoIntentDefinition } from "./types";
import { getAddressLegacyWithDeviceDemoIntentJob } from "./job";

export const getAddressLegacyWithDeviceDemoIntentDefinition: GetAddressLegacyWithDeviceDemoIntentDefinition =
  {
    label: "Get Address (Legacy withDevice)",
    requiresConnectedDevice: true,
    delegateDeviceLockStateHandlingToExecutor: false,
    job: getAddressLegacyWithDeviceDemoIntentJob,
  };

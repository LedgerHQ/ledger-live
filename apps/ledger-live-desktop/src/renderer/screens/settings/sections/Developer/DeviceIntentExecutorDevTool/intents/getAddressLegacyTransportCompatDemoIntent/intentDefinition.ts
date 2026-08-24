import { type GetAddressLegacyTransportCompatDemoIntentDefinition } from "./types";
import { getAddressLegacyTransportCompatDemoIntentJob } from "./job";

export const getAddressLegacyTransportCompatDemoIntentDefinition: GetAddressLegacyTransportCompatDemoIntentDefinition =
  {
    label: "Get Address (Legacy Transport Compatibility)",
    requiresConnectedDevice: true,
    delegateDeviceLockStateHandlingToExecutor: false,
    job: getAddressLegacyTransportCompatDemoIntentJob,
  };

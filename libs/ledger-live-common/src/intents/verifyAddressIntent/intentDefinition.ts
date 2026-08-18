import { verifyAddressIntentJob } from "./job";
import type { VerifyAddressIntentDefinition } from "./types";

export const verifyAddressIntentDefinition: VerifyAddressIntentDefinition = {
  label: "Verify address",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: verifyAddressIntentJob,
};

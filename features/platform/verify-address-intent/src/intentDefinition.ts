import { verifyAddressIntentJob } from "./job";
import type { VerifyAddressIntentDefinition } from "./types";

/**
 * Cross-platform definition for the receive-address verification intent.
 *
 * The device is required, and device lock-state handling is left to the job so
 * the underlying device-action's own states surface through
 * {@link VerifyAddressIntentJobState}.
 */
export const verifyAddressIntentDefinition: VerifyAddressIntentDefinition = {
  label: "Verify address",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: verifyAddressIntentJob,
};

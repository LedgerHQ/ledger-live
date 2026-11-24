import { verifyAddressIntentJob } from "./job";
import type { VerifyAddressIntentDefinition, VerifyAddressIntentResult } from "./types";

/**
 * Cross-platform definition for the receive-address verification intent, reporting a
 * {@link VerifyAddressIntentResult} through `onResult`.
 *
 * The device is required, and device lock-state handling is left to the job so
 * the underlying device-action's own states surface through
 * {@link VerifyAddressIntentJobState}.
 */
export const verifyAddressIntentDefinitionWithResult: VerifyAddressIntentDefinition<VerifyAddressIntentResult> =
  {
    label: "Verify address",
    requiresConnectedDevice: true,
    delegateDeviceLockStateHandlingToExecutor: false,
    job: verifyAddressIntentJob,
  };

const ignoreResult = () => {};

/** The same intent for a host that ignores the result. */
export const verifyAddressIntentDefinition: VerifyAddressIntentDefinition = {
  ...verifyAddressIntentDefinitionWithResult,
  job: params => verifyAddressIntentJob({ ...params, onResult: ignoreResult }),
};

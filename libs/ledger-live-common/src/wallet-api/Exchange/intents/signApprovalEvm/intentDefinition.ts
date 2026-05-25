import { signApprovalEvmJob } from "./job";
import type { SignApprovalEvmIntentDefinition } from "./types";

/**
 * Cross-platform definition for the EVM token-approval signing intent used by
 * the swap flow.
 *
 * The device is required and lock-state handling is left to the job so the
 * device-action's own UI states can be surfaced through {@link SignApprovalEvmJobState}.
 */
export const signApprovalEvmIntentDefinition: SignApprovalEvmIntentDefinition = {
  label: "Sign EVM token approval",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: signApprovalEvmJob,
};

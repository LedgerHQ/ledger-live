import { signSwapEvmJob } from "./job";
import type { SignSwapEvmIntentDefinition } from "./types";

/**
 * Cross-platform definition for the EVM swap signing intent. Mirrors
 * {@link signApprovalEvmIntentDefinition}.
 */
export const signSwapEvmIntentDefinition: SignSwapEvmIntentDefinition = {
  label: "Sign EVM swap",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: signSwapEvmJob,
};

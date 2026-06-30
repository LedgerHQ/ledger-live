import { signPermit2EvmJob } from "./job";
import type { SignPermit2EvmIntentDefinition } from "./types";

/**
 * Cross-platform definition for the Permit2 EIP-712 signing intent used
 * by the swap flow.
 *
 * The device is required and lock-state handling is left to the job so
 * the device-action's own UI states can be surfaced through
 * {@link SignPermit2EvmJobState}.
 */
export const signPermit2EvmIntentDefinition: SignPermit2EvmIntentDefinition = {
  label: "Sign EVM Permit2 typed data",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: signPermit2EvmJob,
};

import { signRfqOrderEvmJob } from "./job";
import type { SignRfqOrderEvmIntentDefinition } from "./types";

/**
 * Cross-platform definition for the RFQ order EIP-712 signing intent
 * (UniswapX, 1inch Fusion).
 *
 * The device is required and lock-state handling is left to the job so
 * the device-action's own UI states can be surfaced through
 * {@link SignRfqOrderEvmJobState}.
 */
export const signRfqOrderEvmIntentDefinition: SignRfqOrderEvmIntentDefinition =
  {
    label: "Sign EVM RFQ order typed data",
    requiresConnectedDevice: true,
    delegateDeviceLockStateHandlingToExecutor: false,
    job: signRfqOrderEvmJob,
  };

import { broadcastEvmJob } from "./job";
import type { BroadcastEvmIntentDefinition } from "./types";

/**
 * Cross-platform definition for the EVM broadcast-and-wait-for-receipt intent.
 *
 * Shared with the future swap-broadcast step. The job does not talk to the
 * device, so `requiresConnectedDevice` is `false` — but the executor is still
 * mounted (the device stays connected from the previous signing intent).
 */
export const broadcastEvmIntentDefinition: BroadcastEvmIntentDefinition = {
  label: "Broadcast EVM transaction",
  requiresConnectedDevice: false,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: broadcastEvmJob,
};

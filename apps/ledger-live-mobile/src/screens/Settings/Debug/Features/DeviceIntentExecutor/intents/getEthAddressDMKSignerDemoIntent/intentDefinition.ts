import { type GetEthAddressDMKSignerDemoIntentDefinition } from "./types";
import { getEthAddressDMKSignerDemoIntentJob } from "./job";

/**
 * Derives an ETH address using the DMK `SignerEthBuilder` directly.
 * Demonstrates how to wrap a DMK signer kit device action into an intent job,
 * mapping its `DeviceActionStatus` states to typed job states.
 */
export const getEthAddressDMKSignerDemoIntentDefinition: GetEthAddressDMKSignerDemoIntentDefinition =
  {
    label: "Get ETH Address (DMK Signer)",
    requiresConnectedDevice: true,
    delegateDeviceLockStateHandlingToExecutor: false,
    job: getEthAddressDMKSignerDemoIntentJob,
  };

import { type GetAddressLegacyWithDeviceDemoIntentDefinition } from "./types";
import { getAddressLegacyWithDeviceDemoIntentJob } from "./job";

/**
 * Derives an address using the legacy `withDevice` + live-common `getAddress` code path.
 * Demonstrates how to bridge existing live-common transport-based logic into an intent job
 * by obtaining a transport via `withDevice` and the executor-provided `compatDeviceId`.
 */
export const getAddressLegacyWithDeviceDemoIntentDefinition: GetAddressLegacyWithDeviceDemoIntentDefinition =
  {
    label: "Get Address (Legacy withDevice)",
    requiresConnectedDevice: true,
    delegateDeviceLockStateHandlingToExecutor: false,
    job: getAddressLegacyWithDeviceDemoIntentJob,
  };

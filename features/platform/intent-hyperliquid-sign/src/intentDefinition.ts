import { DeviceModelId } from "@ledgerhq/device-management-kit";
import {
  acceptedDeviceModelIdsExcluding,
  type DeviceConnectionParams,
} from "@features/platform-device-intent";
import { hyperliquidSignIntentJob } from "./job";
import type { HyperliquidSignIntentDefinition } from "./types";

export const HYPERLIQUID_APP_NAME = "Hyperliquid";

export const HYPERLIQUID_DEVICE_CONNECTION_PARAMS: DeviceConnectionParams = {
  acceptedDeviceModelIds: acceptedDeviceModelIdsExcluding([DeviceModelId.NANO_S]),
};

export const hyperliquidSignIntentDefinition: HyperliquidSignIntentDefinition = {
  label: "Sign Hyperliquid actions",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: hyperliquidSignIntentJob,
};

import { DeviceModelId } from "@ledgerhq/device-management-kit";

export const MIN_BATTERY_PERCENTAGE = 20;

/** DMK does not export its `ChargingMode` enum, whose `NONE` member is `0`. */
export const CHARGING_MODE_NONE = 0;

export const DEVICE_MODELS_WITH_BATTERY = new Set([
  DeviceModelId.NANO_X,
  DeviceModelId.STAX,
  DeviceModelId.FLEX,
  DeviceModelId.APEX,
]);

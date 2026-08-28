import { DeviceModelId } from "@ledgerhq/device-management-kit";

export const MIN_BATTERY_PERCENTAGE = 20;
export const POLL_INTERVAL_MS = 1_000;
/**
 * Must outlast the transport reconnection window, since the session only reports
 * `NOT_CONNECTED` once that window closes: 15s on Android BLE, 10s on iOS BLE.
 */
export const SESSION_SETTLE_TIMEOUT_MS = 20_000;

/** DMK does not export its `ChargingMode` enum, whose `NONE` member is `0`. */
export const CHARGING_MODE_NONE = 0;

export const DEVICE_MODELS_WITH_BATTERY = new Set([
  DeviceModelId.NANO_X,
  DeviceModelId.STAX,
  DeviceModelId.FLEX,
  DeviceModelId.APEX,
]);

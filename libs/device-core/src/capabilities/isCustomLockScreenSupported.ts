import { DeviceModelId } from "@ledgerhq/devices";

export const supportedDeviceModelIds = [
  DeviceModelId.stax,
  DeviceModelId.europa,
  DeviceModelId.apex,
] as const;

export type CLSSupportedDeviceModelId = (typeof supportedDeviceModelIds)[number];

export function isCustomLockScreenSupported(
  deviceModelId: DeviceModelId,
): deviceModelId is CLSSupportedDeviceModelId {
  switch (deviceModelId) {
    case DeviceModelId.stax:
    case DeviceModelId.europa:
    case DeviceModelId.apex:
      return true;
    default:
      return false;
  }
}

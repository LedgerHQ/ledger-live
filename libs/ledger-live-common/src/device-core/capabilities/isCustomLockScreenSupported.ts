import { DeviceModelId } from "@ledgerhq/devices";

export function isCustomLockScreenSupported(deviceModelId: DeviceModelId) {
  switch (deviceModelId) {
    case DeviceModelId.stax:
    case DeviceModelId.europa:
      return true;
    default:
      return false;
  }
}

export const supportedDeviceModelIds = Object.values(DeviceModelId).filter(deviceModelId =>
  isCustomLockScreenSupported(deviceModelId),
);

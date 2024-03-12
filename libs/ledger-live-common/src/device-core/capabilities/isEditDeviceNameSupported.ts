import { DeviceModelId } from "@ledgerhq/devices";

export function isEditDeviceNameSupported(deviceModelId: DeviceModelId) {
  return [DeviceModelId.stax, DeviceModelId.nanoX, DeviceModelId.europa].includes(deviceModelId);
}

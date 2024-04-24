import { DeviceModelId } from "@ledgerhq/devices";

export function isEditDeviceNameSupported(deviceModelId: DeviceModelId) {
  return [
    DeviceModelId.nanoX,
    DeviceModelId.nanoSP,
    DeviceModelId.stax,
    DeviceModelId.europa,
  ].includes(deviceModelId);
}

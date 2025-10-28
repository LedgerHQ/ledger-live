import { DeviceModelId } from "@ledgerhq/devices";

export function getDeviceHasBattery(deviceModelId: DeviceModelId) {
  return ![DeviceModelId.nanoS, DeviceModelId.nanoSP].includes(deviceModelId);
}

import { DeviceModelId } from ".";

export function isDeviceModelId(val: string | undefined | null): val is DeviceModelId {
  if (!val) return false;
  return Object.values(DeviceModelId).includes(val as DeviceModelId);
}

export const stringToDeviceModelId = (
  strDeviceModelId: string,
  defaultDeviceModelId: DeviceModelId,
): DeviceModelId => {
  if (!isDeviceModelId(strDeviceModelId)) return defaultDeviceModelId;
  return DeviceModelId[strDeviceModelId];
};

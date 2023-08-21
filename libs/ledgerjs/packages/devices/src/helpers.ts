import { DeviceModelId } from ".";

export const stringToDeviceModelId = (
  strDeviceModelId: string,
  defaultDeviceModelId: DeviceModelId,
): DeviceModelId => {
  if (Object.values(DeviceModelId)?.includes(strDeviceModelId as DeviceModelId)) {
    return DeviceModelId[strDeviceModelId as DeviceModelId];
  }

  return defaultDeviceModelId;
};

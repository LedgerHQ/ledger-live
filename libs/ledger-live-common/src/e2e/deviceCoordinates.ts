import { DeviceModelId } from "@ledgerhq/devices";
import { getSpeculosModel } from "./speculosAppVersion";

type CoordinateKey =
  | "settingsToggle1"
  | "settingsCogwheel"
  | "turnOnSync"
  | "ensArrowOpen"
  | "arrowBack";

const deviceCoordinatesMap: Record<
  CoordinateKey,
  Partial<Record<DeviceModelId, { x: number; y: number }>>
> = {
  settingsToggle1: {
    [DeviceModelId.stax]: { x: 345, y: 136 },
    [DeviceModelId.europa]: { x: 420, y: 140 },
    [DeviceModelId.apex]: { x: 263, y: 100 },
  },
  settingsCogwheel: {
    [DeviceModelId.stax]: { x: 362, y: 43 },
    [DeviceModelId.europa]: { x: 400, y: 80 },
    [DeviceModelId.apex]: { x: 253, y: 58 },
  },
  turnOnSync: {
    [DeviceModelId.stax]: { x: 121, y: 532 },
    [DeviceModelId.europa]: { x: 151, y: 446 },
    [DeviceModelId.apex]: { x: 90, y: 301 },
  },
  ensArrowOpen: {
    [DeviceModelId.stax]: { x: 360, y: 360 },
    [DeviceModelId.europa]: { x: 426, y: 388 },
    [DeviceModelId.apex]: { x: 272, y: 254 },
  },
  arrowBack: {
    [DeviceModelId.stax]: { x: 40, y: 40 },
    [DeviceModelId.europa]: { x: 44, y: 46 },
    [DeviceModelId.apex]: { x: 30, y: 30 },
  },
};

export function getDeviceCoordinates(key: CoordinateKey): { x: number; y: number } {
  const model = getSpeculosModel();
  const coords = deviceCoordinatesMap[key];
  const result = coords[model];
  if (!result) {
    throw new Error(`No coordinates defined for key "${key}" on device model "${model}"`);
  }
  return result;
}

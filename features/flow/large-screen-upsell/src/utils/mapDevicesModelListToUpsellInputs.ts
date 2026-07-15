import type { NanoDeviceModelId, TouchscreenDeviceModelId } from "../types";

const TOUCHSCREEN_DEVICE_MODEL_IDS = new Set<TouchscreenDeviceModelId>(["stax", "europa", "apex"]);

function isTouchscreenDeviceModelId(
  deviceModelId: string,
): deviceModelId is TouchscreenDeviceModelId {
  return TOUCHSCREEN_DEVICE_MODEL_IDS.has(deviceModelId as TouchscreenDeviceModelId);
}

function toNanoDeviceModelId(deviceModelId: string): NanoDeviceModelId | null {
  switch (deviceModelId) {
    case "nanoS":
    case "nanoSP":
    case "nanoX":
      return deviceModelId;
    default:
      return null;
  }
}

export function mapDevicesModelListToUpsellInputs(devicesModelList: readonly string[]): {
  seenNanoModelIds: NanoDeviceModelId[];
  hasSeenTouchscreenDevice: boolean;
} {
  const seenNanoModelIds = devicesModelList
    .map(toNanoDeviceModelId)
    .filter((deviceModelId): deviceModelId is NanoDeviceModelId => deviceModelId !== null);

  return {
    seenNanoModelIds,
    hasSeenTouchscreenDevice: devicesModelList.some(isTouchscreenDeviceModelId),
  };
}

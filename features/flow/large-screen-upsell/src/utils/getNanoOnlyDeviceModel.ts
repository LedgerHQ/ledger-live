import type { NanoDeviceModelId } from "../types";
import {
  mapDevicesModelListToUpsellInputs,
  toNanoDeviceModelId,
} from "./mapDevicesModelListToUpsellInputs";

export function getNanoOnlyDeviceModel(
  devicesModelList: readonly string[],
  lastSeenModelId?: string | null,
): NanoDeviceModelId | undefined {
  const { seenNanoModelIds, hasSeenTouchscreenDevice } =
    mapDevicesModelListToUpsellInputs(devicesModelList);

  if (hasSeenTouchscreenDevice) {
    return undefined;
  }

  return (lastSeenModelId ? toNanoDeviceModelId(lastSeenModelId) : null) ?? seenNanoModelIds[0];
}

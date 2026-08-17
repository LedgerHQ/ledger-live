import {
  mapDevicesModelListToUpsellInputs,
  type NanoDeviceModelId,
} from "@features/flow-large-screen-upsell";

export function getRecoveryKeyIncompatibleModel(
  devicesModelList: readonly string[],
  lastSeenModelId?: string | null,
): NanoDeviceModelId | undefined {
  const { seenNanoModelIds, hasSeenTouchscreenDevice } =
    mapDevicesModelListToUpsellInputs(devicesModelList);

  if (hasSeenTouchscreenDevice || seenNanoModelIds.length === 0) {
    return undefined;
  }

  return seenNanoModelIds.find(id => id === lastSeenModelId) ?? seenNanoModelIds[0];
}

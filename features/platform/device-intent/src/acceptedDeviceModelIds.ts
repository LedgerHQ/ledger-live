import { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { DeviceConnectionParams } from "./core";

const ALL_DEVICE_MODELS = Object.values(DeviceModelId);

/**
 * `acceptedDeviceModelIds` for an intent that some device models can no longer run (an app that
 * dropped Nano S, for one). No exclusion keeps `[]`, which the executor reads as every model.
 */
export function acceptedDeviceModelIdsExcluding(
  unsupportedDeviceModelIds: readonly string[] = [],
): DeviceConnectionParams["acceptedDeviceModelIds"] {
  if (unsupportedDeviceModelIds.length === 0) return [];
  return ALL_DEVICE_MODELS.filter(model => !unsupportedDeviceModelIds.includes(model));
}

import { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { DeviceConnectionParams } from "./core";
import { NoAcceptedDeviceModelError } from "./errors";

const ALL_DEVICE_MODEL_IDS = Object.values(DeviceModelId);

/**
 * Builds `DeviceConnectionParams.acceptedDeviceModelIds` from the models a flow cannot run on.
 * Without exclusion it returns `[]`, which the executor reads as every model accepted.
 *
 * @throws {NoAcceptedDeviceModelError} when every model is excluded.
 */
export function acceptedDeviceModelIdsExcluding(
  unsupportedDeviceModelIds: readonly DeviceModelId[] = [],
): DeviceConnectionParams["acceptedDeviceModelIds"] {
  if (unsupportedDeviceModelIds.length === 0) return [];

  const unsupported = new Set(unsupportedDeviceModelIds);
  const accepted = ALL_DEVICE_MODEL_IDS.filter(modelId => !unsupported.has(modelId));
  if (accepted.length === 0) throw new NoAcceptedDeviceModelError();

  return accepted;
}

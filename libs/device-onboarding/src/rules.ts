import { DeviceModelId } from "@ledgerhq/device-management-kit";
import semver from "semver";

export type FirmwareVersionInput = {
  currentVersion: string;
  deviceModelId: DeviceModelId;
};

const modelsWithoutNewFlow = new Set<DeviceModelId>([DeviceModelId.NANO_S]);

export const minimumNanoVersions = new Map<DeviceModelId, string>([
  [DeviceModelId.NANO_SP, "1.1.0"],
  [DeviceModelId.NANO_X, "2.2.0"],
]);

export function requiresLegacyFlow({
  currentVersion,
  deviceModelId,
}: FirmwareVersionInput): boolean {
  if (modelsWithoutNewFlow.has(deviceModelId)) {
    return true;
  }

  const minimum = minimumNanoVersions.get(deviceModelId);

  if (minimum === undefined) {
    return false;
  }

  const coerced = semver.coerce(currentVersion);

  return coerced === null || semver.lt(coerced, minimum);
}

const touchscreenModels = new Set<DeviceModelId>([
  DeviceModelId.STAX,
  DeviceModelId.FLEX,
  DeviceModelId.APEX,
]);

export function isTouchscreen(deviceModelId: DeviceModelId): boolean {
  return touchscreenModels.has(deviceModelId);
}

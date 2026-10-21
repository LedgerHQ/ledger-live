import { DeviceModelId } from "@ledgerhq/device-management-kit";
import semver from "semver";

export type FirmwareVersionInput = {
  currentVersion: string;
  deviceModelId: DeviceModelId;
};

export function requiresLegacyFlow({ currentVersion }: FirmwareVersionInput): boolean {
  return semver.coerce(currentVersion) === null;
}

const touchscreenModels = new Set<DeviceModelId>([
  DeviceModelId.STAX,
  DeviceModelId.FLEX,
  DeviceModelId.APEX,
]);

export function isTouchscreen(deviceModelId: DeviceModelId): boolean {
  return touchscreenModels.has(deviceModelId);
}

import { DeviceModelId } from "@ledgerhq/device-management-kit";
import semver from "semver";
import type { FirmwareCheck } from "./types";

export type FirmwareVersionInput = {
  currentVersion: string;
  deviceModelId: DeviceModelId;
  isOnboarded: boolean;
};

/**
 * Bounds are inclusive. Below `oldestDriven` an unseeded Nano cannot run the genuine check; up to
 * `lastUpdateAfterSetup` it can only update its firmware once seeded.
 */
type UnseededNanoFirmware = { oldestDriven: string; lastUpdateAfterSetup: string };

const unseededNanoFirmware = new Map<DeviceModelId, UnseededNanoFirmware>([
  [DeviceModelId.NANO_X, { oldestDriven: "2.2.0", lastUpdateAfterSetup: "2.7.0" }],
  [DeviceModelId.NANO_SP, { oldestDriven: "1.1.0", lastUpdateAfterSetup: "1.6.0" }],
]);

export function requiresLegacyFlow({
  currentVersion,
  deviceModelId,
  isOnboarded,
}: FirmwareVersionInput): boolean {
  const version = semver.coerce(currentVersion);
  if (version === null) return true;
  if (deviceModelId === DeviceModelId.NANO_S) return true;
  if (isOnboarded) return false;

  const bounds = unseededNanoFirmware.get(deviceModelId);
  return bounds !== undefined && semver.lt(version, bounds.oldestDriven);
}

export function updateWaitsForSeed({
  currentVersion,
  deviceModelId,
  isOnboarded,
}: FirmwareVersionInput): boolean {
  const version = semver.coerce(currentVersion);
  const bounds = unseededNanoFirmware.get(deviceModelId);
  if (isOnboarded || version === null || bounds === undefined) return false;

  return (
    semver.gte(version, bounds.oldestDriven) && semver.lte(version, bounds.lastUpdateAfterSetup)
  );
}

const touchscreenModels = new Set<DeviceModelId>([
  DeviceModelId.STAX,
  DeviceModelId.FLEX,
  DeviceModelId.APEX,
]);

export function isTouchscreen(deviceModelId: DeviceModelId): boolean {
  return touchscreenModels.has(deviceModelId);
}

type SettledFirmware = Extract<
  FirmwareCheck,
  { kind: "upToDate" | "declined" | "skipped" | "deferred" }
>;

const settledFirmwareKinds = new Set<FirmwareCheck["kind"]>([
  "upToDate",
  "declined",
  "skipped",
  "deferred",
]);

export function firmwareSettled(firmware: FirmwareCheck | null): firmware is SettledFirmware {
  return firmware !== null && settledFirmwareKinds.has(firmware.kind);
}

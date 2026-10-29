import { DeviceModelId } from "@ledgerhq/device-management-kit";
import semver from "semver";
import type { FirmwareCheck } from "./types";

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

type SettledFirmware = Extract<FirmwareCheck, { kind: "upToDate" | "declined" | "skipped" }>;

const settledFirmwareKinds = new Set<FirmwareCheck["kind"]>(["upToDate", "declined", "skipped"]);

export function firmwareSettled(firmware: FirmwareCheck | null): firmware is SettledFirmware {
  return firmware !== null && settledFirmwareKinds.has(firmware.kind);
}

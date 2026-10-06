import { DeviceModelId, type GetOsVersionResponse } from "@ledgerhq/device-management-kit";
import { coerce, gte } from "semver";
import { RecoveryKeyStatus } from "../types";

const recoveryKeyFieldIndex = 4;

const minimumRecoveryKeyVersion = new Map<DeviceModelId, string>([
  [DeviceModelId.STAX, "1.7.0"],
  [DeviceModelId.FLEX, "1.3.0"],
  [DeviceModelId.APEX, "0.0.0"],
]);

const statusFromBits = new Map<number, RecoveryKeyStatus>([
  [0x1, RecoveryKeyStatus.Rejected],
  [0x2, RecoveryKeyStatus.Choice],
  [0x3, RecoveryKeyStatus.Running],
  [0x4, RecoveryKeyStatus.Naming],
  [0x5, RecoveryKeyStatus.Ready],
]);

export function deviceReportsRecoveryKey(
  deviceModelId: DeviceModelId | void,
  seVersion: string,
): boolean {
  if (!deviceModelId) {
    return false;
  }

  const minimum = minimumRecoveryKeyVersion.get(deviceModelId);

  if (minimum === undefined) {
    return false;
  }

  const version = coerce(seVersion);

  return version !== null && gte(version, minimum);
}

export function readRecoveryKeyStatus(
  data: Uint8Array,
  deviceModelId: DeviceModelId | void,
  seVersion: string,
): RecoveryKeyStatus | null {
  if (!deviceReportsRecoveryKey(deviceModelId, seVersion)) {
    return null;
  }

  const field = recoveryKeyField(data);

  if (field === null || field.length === 0) {
    return null;
  }

  return statusFromBits.get(field[0] & 0x0f) ?? null;
}

const recoveryKeyStatuses = new Set<string>(Object.values(RecoveryKeyStatus));

export function attachedRecoveryKeyStatus(
  response: GetOsVersionResponse,
): RecoveryKeyStatus | null {
  const status = (response as { recoveryKeyStatus?: unknown }).recoveryKeyStatus;

  if (typeof status !== "string" || !recoveryKeyStatuses.has(status)) {
    return null;
  }

  return status as RecoveryKeyStatus;
}

function recoveryKeyField(data: Uint8Array): Uint8Array | null {
  if (data.length < 5) {
    return null;
  }

  const flagsLengthIndex = 5 + data[4];

  if (flagsLengthIndex >= data.length) {
    return null;
  }

  let offset = flagsLengthIndex + 1 + data[flagsLengthIndex];

  for (let index = 0; index <= recoveryKeyFieldIndex; index += 1) {
    if (offset >= data.length) {
      return null;
    }

    const length = data[offset];
    const start = offset + 1;
    const end = start + length;

    if (end > data.length) {
      return null;
    }

    if (index === recoveryKeyFieldIndex) {
      return data.subarray(start, end);
    }

    offset = end;
  }

  return null;
}

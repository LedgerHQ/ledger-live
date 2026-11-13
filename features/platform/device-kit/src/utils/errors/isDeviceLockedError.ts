import { someNestedError } from "./internals";

export const DEVICE_LOCKED_STATUS_WORD = "5515";

function isLockedStatusWord(statusCode: unknown): boolean {
  if (!(statusCode instanceof Uint8Array) || statusCode.length < 2) {
    return false;
  }
  return statusCode[0] === 0x55 && statusCode[1] === 0x15;
}

export function isDeviceLockedError(error: unknown): boolean {
  return someNestedError(
    error,
    current =>
      ("_tag" in current && current._tag === "DeviceLockedError") ||
      ("errorCode" in current && current.errorCode === DEVICE_LOCKED_STATUS_WORD) ||
      ("statusCode" in current && isLockedStatusWord(current.statusCode)),
  );
}

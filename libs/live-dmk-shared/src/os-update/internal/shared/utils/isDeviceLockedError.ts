export const DEVICE_LOCKED_STATUS_WORD = "5515";

function isLockedStatusWord(statusCode: unknown): boolean {
  if (!(statusCode instanceof Uint8Array) || statusCode.length < 2) {
    return false;
  }
  return statusCode[0] === 0x55 && statusCode[1] === 0x15;
}

export function isDeviceLockedError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  if (
    ("_tag" in error && error._tag === "DeviceLockedError") ||
    ("errorCode" in error && error.errorCode === DEVICE_LOCKED_STATUS_WORD) ||
    ("statusCode" in error && isLockedStatusWord(error.statusCode))
  ) {
    return true;
  }

  // CommandResult / DeviceActionState / XState onError: { error: DmkError }
  if ("error" in error && error.error !== error) {
    return isDeviceLockedError(error.error);
  }

  return false;
}

const DISCONNECT_ERROR_TAGS = [
  "DeviceDisconnectedWhileSendingError",
  "DeviceDisconnectedBeforeSendingApdu",
  // DMK only drops a session once the device connection is terminated for good.
  "DeviceSessionNotFound",
] as const;

export function isDeviceDisconnectedError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  if (
    "_tag" in error &&
    DISCONNECT_ERROR_TAGS.includes(error._tag as (typeof DISCONNECT_ERROR_TAGS)[number])
  ) {
    return true;
  }

  // CommandResult / DeviceActionState / XState onError: { error: DmkError }
  if ("error" in error && error.error !== error) {
    return isDeviceDisconnectedError(error.error);
  }

  return false;
}

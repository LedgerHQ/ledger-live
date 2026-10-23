const DEVICE_DISCONNECTED_ERROR_TAGS = new Set([
  "DeviceDisconnectedWhileSendingError",
  "DeviceDisconnectedBeforeSendingApdu",
  "DeviceSessionNotFound",
  "DisconnectError",
  "WebHidSendReportError",
]);

const NESTED_ERROR_FIELDS = ["error", "originalError", "cause", "err"] as const;

export function isDeviceDisconnectedError(error: unknown): boolean {
  return hasDeviceDisconnectedTag(error, new Set());
}

function hasDeviceDisconnectedTag(error: unknown, seen: Set<object>): boolean {
  if (typeof error !== "object" || error === null || seen.has(error)) {
    return false;
  }

  seen.add(error);

  if (
    "_tag" in error &&
    typeof error._tag === "string" &&
    DEVICE_DISCONNECTED_ERROR_TAGS.has(error._tag)
  ) {
    return true;
  }

  const record = error as Record<string, unknown>;
  return NESTED_ERROR_FIELDS.some(
    field => field in record && hasDeviceDisconnectedTag(record[field], seen),
  );
}

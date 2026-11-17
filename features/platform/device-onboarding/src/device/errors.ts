const refusedByUserTag = "RefusedByUserDAError";
const secureChannelTags = new Set(["SecureChannelError", "WebSocketConnectionError"]);
/** DMK's `HttpFetchApiError`, which every manager catalogue call rejects with, is tagged `FetchError`. */
const catalogueTag = "FetchError";
// A superset of `isDeviceDisconnectedError` in libs/live-dmk-shared, which features/ cannot import.
const disconnectTags = new Set([
  "DeviceDisconnectedWhileSendingError",
  "DeviceDisconnectedBeforeSendingApdu",
  "DeviceSessionNotFound",
  "DisconnectError",
  "WebHidSendReportError",
]);
const nestedErrorFields = ["error", "originalError", "cause", "err"] as const;

export function isDeviceRefusal(error: unknown): boolean {
  return errorTag(error) === refusedByUserTag;
}

export function isSecureChannelLost(error: unknown): boolean {
  const tag = errorTag(error);

  return tag !== undefined && secureChannelTags.has(tag);
}

export function isCatalogueUnreachable(error: unknown): boolean {
  return errorTag(error) === catalogueTag;
}

export function isDeviceDisconnected(error: unknown): boolean {
  return hasDisconnectTag(error, new Set());
}

function hasDisconnectTag(error: unknown, seen: Set<object>): boolean {
  if (typeof error !== "object" || error === null || seen.has(error)) {
    return false;
  }

  seen.add(error);
  const tag = errorTag(error);

  if (tag !== undefined && disconnectTags.has(tag)) {
    return true;
  }

  const record = error as Record<string, unknown>;

  return nestedErrorFields.some(field => hasDisconnectTag(record[field], seen));
}

function errorTag(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("_tag" in error)) {
    return undefined;
  }

  const { _tag } = error as { _tag: unknown };

  return typeof _tag === "string" ? _tag : undefined;
}

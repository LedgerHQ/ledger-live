import { someNestedError } from "./internals";

const DISCONNECT_ERROR_TAGS = new Set([
  "DeviceDisconnectedWhileSendingError",
  "DeviceDisconnectedBeforeSendingApdu",
  // DMK only drops a session once the device connection is terminated for good.
  "DeviceSessionNotFound",
  "DisconnectError",
  "WebHidSendReportError",
]);

export function isDeviceDisconnectedError(error: unknown): boolean {
  return someNestedError(error, current => {
    const tag = "_tag" in current ? current._tag : undefined;
    return typeof tag === "string" && DISCONNECT_ERROR_TAGS.has(tag);
  });
}

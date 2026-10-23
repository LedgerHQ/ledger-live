import { isDeviceDisconnectedError } from "./isDeviceDisconnectedError";

describe("isDeviceDisconnectedError", () => {
  it.each([
    "DeviceDisconnectedWhileSendingError",
    "DeviceDisconnectedBeforeSendingApdu",
    "DeviceSessionNotFound",
    "DisconnectError",
    "WebHidSendReportError",
  ])("should match a %s tag", tag => {
    expect(isDeviceDisconnectedError({ _tag: tag })).toBe(true);
  });

  it.each(["error", "originalError", "cause", "err"] as const)(
    "should match a WebHidSendReportError wrapped in %s",
    field => {
      expect(isDeviceDisconnectedError({ [field]: { _tag: "WebHidSendReportError" } })).toBe(true);
    },
  );

  it("should ignore unrelated errors and cyclic values", () => {
    const cyclic: { error?: unknown } = {};
    cyclic.error = cyclic;

    expect(isDeviceDisconnectedError(new Error("transport disconnected"))).toBe(false);
    expect(isDeviceDisconnectedError({ _tag: "UnknownDAError" })).toBe(false);
    expect(isDeviceDisconnectedError(undefined)).toBe(false);
    expect(isDeviceDisconnectedError(cyclic)).toBe(false);
  });
});

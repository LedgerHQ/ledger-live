import { isDeviceDisconnected } from "./errors";

describe("isDeviceDisconnected", () => {
  it.each([
    "DeviceDisconnectedWhileSendingError",
    "DeviceDisconnectedBeforeSendingApdu",
    "DeviceSessionNotFound",
    "DisconnectError",
    "WebHidSendReportError",
  ])("should match a %s tag", tag => {
    expect(isDeviceDisconnected({ _tag: tag })).toBe(true);
  });

  it.each(["error", "originalError", "cause", "err"] as const)(
    "should match a disconnect wrapped in %s",
    field => {
      expect(
        isDeviceDisconnected({ _tag: "SecureChannelError", [field]: { _tag: "DisconnectError" } }),
      ).toBe(true);
    },
  );

  it("should match a disconnect nested two levels deep", () => {
    expect(isDeviceDisconnected({ error: { cause: { _tag: "DisconnectError" } } })).toBe(true);
  });

  it("should ignore an error with another tag", () => {
    expect(isDeviceDisconnected({ _tag: "UnknownDAError" })).toBe(false);
  });

  it.each([new Error("boom"), undefined, null, "DisconnectError"])("should ignore %p", error => {
    expect(isDeviceDisconnected(error)).toBe(false);
  });

  it("should ignore a cyclic value", () => {
    const cyclic: { error?: unknown } = {};
    cyclic.error = cyclic;

    expect(isDeviceDisconnected(cyclic)).toBe(false);
  });
});

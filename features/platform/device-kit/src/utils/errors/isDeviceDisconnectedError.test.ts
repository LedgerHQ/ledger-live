import {
  DeviceDisconnectedBeforeSendingApdu,
  DeviceDisconnectedWhileSendingError,
  DeviceLockedError,
} from "@ledgerhq/device-management-kit";
import { isDeviceDisconnectedError } from "./isDeviceDisconnectedError";

describe("isDeviceDisconnectedError", () => {
  describe("success", () => {
    it("should return true when the error is a DeviceDisconnectedWhileSendingError", () => {
      expect(isDeviceDisconnectedError(new DeviceDisconnectedWhileSendingError())).toBe(true);
    });

    it("should return true when the error is a DeviceDisconnectedBeforeSendingApdu", () => {
      expect(isDeviceDisconnectedError(new DeviceDisconnectedBeforeSendingApdu())).toBe(true);
    });

    it("should return true when the session was dropped by the DMK", () => {
      expect(isDeviceDisconnectedError({ _tag: "DeviceSessionNotFound" })).toBe(true);
    });

    it.each(["DisconnectError", "WebHidSendReportError"])(
      "should return true when the transport reports a %s",
      tag => {
        expect(isDeviceDisconnectedError({ _tag: tag })).toBe(true);
      },
    );

    it("should return true when a nested error is a device-disconnected error", () => {
      expect(isDeviceDisconnectedError({ error: new DeviceDisconnectedWhileSendingError() })).toBe(
        true,
      );
    });

    it.each(["error", "originalError", "cause", "err"])(
      "should return true when a transport error is wrapped in %s",
      field => {
        expect(isDeviceDisconnectedError({ [field]: { _tag: "WebHidSendReportError" } })).toBe(
          true,
        );
      },
    );

    it("should return true when the device-disconnected error is nested several levels deep", () => {
      expect(
        isDeviceDisconnectedError({ error: { cause: { _tag: "DeviceSessionNotFound" } } }),
      ).toBe(true);
    });
  });

  describe("error", () => {
    it("should return false when the value is not an object", () => {
      expect(isDeviceDisconnectedError(undefined)).toBe(false);
      expect(isDeviceDisconnectedError("DeviceDisconnectedWhileSendingError")).toBe(false);
    });

    it("should return false when the value is null", () => {
      expect(isDeviceDisconnectedError(null)).toBe(false);
    });

    it("should return false when the nested error points at itself", () => {
      const cyclic: { error: unknown } = { error: null };
      cyclic.error = cyclic;
      expect(isDeviceDisconnectedError(cyclic)).toBe(false);
    });

    it("should return false when nested errors form a cycle", () => {
      const first: { cause?: unknown } = {};
      const second = { originalError: first };
      first.cause = second;
      expect(isDeviceDisconnectedError(first)).toBe(false);
    });

    it("should return false for an unrelated error", () => {
      expect(isDeviceDisconnectedError({ _tag: "UnknownDAError" })).toBe(false);
    });

    it("should return false for a plain Error without a tag", () => {
      expect(isDeviceDisconnectedError(new Error("transport disconnected"))).toBe(false);
    });

    it("should return false for a device-locked error", () => {
      expect(isDeviceDisconnectedError(new DeviceLockedError())).toBe(false);
    });
  });
});

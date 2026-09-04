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

    it("should return true when a nested error is a device-disconnected error", () => {
      expect(
        isDeviceDisconnectedError({ error: new DeviceDisconnectedWhileSendingError() }),
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

    it("should return false for an unrelated error", () => {
      expect(isDeviceDisconnectedError({ _tag: "UnknownDAError" })).toBe(false);
    });

    it("should return false for a device-locked error", () => {
      expect(isDeviceDisconnectedError(new DeviceLockedError())).toBe(false);
    });
  });
});

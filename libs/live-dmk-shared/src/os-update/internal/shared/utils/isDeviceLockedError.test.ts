import { DeviceLockedError } from "@ledgerhq/device-management-kit";
import { DEVICE_LOCKED_STATUS_WORD, isDeviceLockedError } from "./isDeviceLockedError";

describe("isDeviceLockedError", () => {
  describe("success", () => {
    it("should return true when the error is a DeviceLockedError", () => {
      expect(isDeviceLockedError(new DeviceLockedError())).toBe(true);
    });

    it("should return true when the error code is the device-locked status word", () => {
      expect(isDeviceLockedError({ errorCode: DEVICE_LOCKED_STATUS_WORD })).toBe(true);
    });

    it("should return true when the status code bytes are 0x5515", () => {
      expect(isDeviceLockedError({ statusCode: new Uint8Array([0x55, 0x15]) })).toBe(true);
    });

    it("should return true when a nested error is a device-locked error", () => {
      expect(isDeviceLockedError({ error: new DeviceLockedError() })).toBe(true);
    });
  });

  describe("error", () => {
    it("should return false when the value is not an object", () => {
      expect(isDeviceLockedError(undefined)).toBe(false);
      expect(isDeviceLockedError("DeviceLockedError")).toBe(false);
    });

    it("should return false when the value is null", () => {
      expect(isDeviceLockedError(null)).toBe(false);
    });

    it("should return false when the status code is not a long enough byte array", () => {
      expect(isDeviceLockedError({ statusCode: new Uint8Array([0x55]) })).toBe(false);
      expect(isDeviceLockedError({ statusCode: [0x55, 0x15] })).toBe(false);
    });

    it("should return false when the status code bytes are not 0x5515", () => {
      expect(isDeviceLockedError({ statusCode: new Uint8Array([0x55, 0x00]) })).toBe(false);
    });

    it("should return false when the nested error points at itself", () => {
      const cyclic: { error: unknown } = { error: null };
      cyclic.error = cyclic;
      expect(isDeviceLockedError(cyclic)).toBe(false);
    });

    it("should return false for an unrelated error", () => {
      expect(isDeviceLockedError({ _tag: "UnknownDAError" })).toBe(false);
    });
  });
});

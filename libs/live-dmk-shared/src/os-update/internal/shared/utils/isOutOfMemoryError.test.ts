import { DeviceLockedError } from "@ledgerhq/device-management-kit";
import { isOutOfMemoryError } from "./isOutOfMemoryError";

describe("isOutOfMemoryError", () => {
  describe("success", () => {
    it("should return true when the error is an out of memory error", () => {
      expect(isOutOfMemoryError({ _tag: "OutOfMemoryDAError" })).toBe(true);
    });

    it("should return true when a nested error is an out of memory error", () => {
      expect(isOutOfMemoryError({ error: { _tag: "OutOfMemoryDAError" } })).toBe(true);
    });
  });

  describe("error", () => {
    it("should return false when the value is not an object", () => {
      expect(isOutOfMemoryError(undefined)).toBe(false);
      expect(isOutOfMemoryError("OutOfMemoryDAError")).toBe(false);
    });

    it("should return false when the value is null", () => {
      expect(isOutOfMemoryError(null)).toBe(false);
    });

    it("should return false when the nested error points at itself", () => {
      const cyclic: { error: unknown } = { error: null };
      cyclic.error = cyclic;
      expect(isOutOfMemoryError(cyclic)).toBe(false);
    });

    it("should return false for an unrelated error", () => {
      expect(isOutOfMemoryError(new DeviceLockedError())).toBe(false);
    });
  });
});

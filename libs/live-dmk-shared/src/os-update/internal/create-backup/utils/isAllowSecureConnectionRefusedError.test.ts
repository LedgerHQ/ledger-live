import { RefusedByUserDAError } from "@ledgerhq/device-management-kit";
import { isAllowSecureConnectionRefusedError } from "./isAllowSecureConnectionRefusedError";

describe("isAllowSecureConnectionRefusedError", () => {
  describe("success", () => {
    it("should return true when the error is a RefusedByUserDAError", () => {
      expect(isAllowSecureConnectionRefusedError(new RefusedByUserDAError())).toBe(true);
    });

    it("should return true when the error tag is RefusedByUserDAError", () => {
      expect(isAllowSecureConnectionRefusedError({ _tag: "RefusedByUserDAError" })).toBe(true);
    });

    it("should return true when a nested error is a refused-by-user error", () => {
      expect(isAllowSecureConnectionRefusedError({ error: new RefusedByUserDAError() })).toBe(true);
    });
  });

  describe("error", () => {
    it("should return false when the value is not an object", () => {
      expect(isAllowSecureConnectionRefusedError(undefined)).toBe(false);
      expect(isAllowSecureConnectionRefusedError("RefusedByUserDAError")).toBe(false);
    });

    it("should return false when the value is null", () => {
      expect(isAllowSecureConnectionRefusedError(null)).toBe(false);
    });

    it("should return false when the nested error points at itself", () => {
      const cyclic: { error: unknown } = { error: null };
      cyclic.error = cyclic;
      expect(isAllowSecureConnectionRefusedError(cyclic)).toBe(false);
    });

    it("should return false for an unrelated error", () => {
      expect(isAllowSecureConnectionRefusedError({ _tag: "UnknownDAError" })).toBe(false);
    });
  });
});

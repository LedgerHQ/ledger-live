import { RefusedByUserDAError } from "@ledgerhq/device-management-kit";
import { isRefusedByUserError } from "./isRefusedByUserError";

describe("isRefusedByUserError", () => {
  describe("success", () => {
    it("should return true when the error is a RefusedByUserDAError", () => {
      expect(isRefusedByUserError(new RefusedByUserDAError())).toBe(true);
    });

    it("should return true when the error tag is RefusedByUserDAError", () => {
      expect(isRefusedByUserError({ _tag: "RefusedByUserDAError" })).toBe(true);
    });

    it("should return true when a nested error is a refused-by-user error", () => {
      expect(isRefusedByUserError({ error: new RefusedByUserDAError() })).toBe(true);
    });

    it("should return true when a transport wraps the refused-by-user error in originalError", () => {
      expect(isRefusedByUserError({ originalError: { _tag: "RefusedByUserDAError" } })).toBe(true);
    });
  });

  describe("error", () => {
    it("should return false when the value is not an object", () => {
      expect(isRefusedByUserError(undefined)).toBe(false);
      expect(isRefusedByUserError("RefusedByUserDAError")).toBe(false);
    });

    it("should return false when the value is null", () => {
      expect(isRefusedByUserError(null)).toBe(false);
    });

    it("should return false when the nested error points at itself", () => {
      const cyclic: { error: unknown } = { error: null };
      cyclic.error = cyclic;
      expect(isRefusedByUserError(cyclic)).toBe(false);
    });

    it("should return false when two nested errors point at each other", () => {
      const first: { error?: unknown } = {};
      const second = { error: first };
      first.error = second;
      expect(isRefusedByUserError(first)).toBe(false);
    });

    it("should return false for an unrelated error", () => {
      expect(isRefusedByUserError({ _tag: "UnknownDAError" })).toBe(false);
    });
  });
});

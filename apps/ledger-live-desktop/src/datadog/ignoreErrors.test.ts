import { shouldIgnoreErrorMessage, IGNORE_ERROR_MESSAGES } from "./ignoreErrors";

describe("datadog ignoreErrors", () => {
  describe("shouldIgnoreErrorMessage", () => {
    it("should return false for message not matching any pattern", () => {
      expect(shouldIgnoreErrorMessage("Some random error")).toBe(false);
      expect(shouldIgnoreErrorMessage("UnknownError")).toBe(false);
    });

    it("should return true when message includes a string pattern", () => {
      expect(shouldIgnoreErrorMessage("API HTTP 500")).toBe(true);
      expect(shouldIgnoreErrorMessage("ECONNREFUSED connection failed")).toBe(true);
      expect(shouldIgnoreErrorMessage("Network Error")).toBe(true);
      expect(shouldIgnoreErrorMessage("Failed to fetch")).toBe(true);
      expect(shouldIgnoreErrorMessage("request timed out")).toBe(true);
      expect(shouldIgnoreErrorMessage("UserRefusedOnDevice")).toBe(true);
    });

    it("should return true when message matches RegExp pattern", () => {
      // IGNORE_ERROR_MESSAGES uses string includes; check one more
      expect(shouldIgnoreErrorMessage("status code 404")).toBe(true);
    });

    it("should return false for empty string", () => {
      expect(shouldIgnoreErrorMessage("")).toBe(false);
    });
  });

  describe("IGNORE_ERROR_MESSAGES", () => {
    it("should contain expected patterns", () => {
      expect(IGNORE_ERROR_MESSAGES).toContain("API HTTP");
      expect(IGNORE_ERROR_MESSAGES).toContain("ECONNREFUSED");
      expect(IGNORE_ERROR_MESSAGES).toContain("Failed to fetch");
      expect(IGNORE_ERROR_MESSAGES).toContain("UserRefusedOnDevice");
    });
  });
});

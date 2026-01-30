import { clampDecimals, isOverDecimalLimit, trimTrailingZeros } from "../decimals";

describe("decimals", () => {
  describe("clampDecimals", () => {
    it("should clamp decimals to 2 digits", () => {
      expect(clampDecimals("123.456")).toBe("123.45");
      expect(clampDecimals("123,456")).toBe("123,45");
    });

    it("should not modify values with 2 or fewer decimals", () => {
      expect(clampDecimals("123.45")).toBe("123.45");
      expect(clampDecimals("123.4")).toBe("123.4");
      expect(clampDecimals("123")).toBe("123");
    });

    it("should handle values without decimals", () => {
      expect(clampDecimals("123")).toBe("123");
    });
  });

  describe("isOverDecimalLimit", () => {
    it("should detect values over 2 decimal limit", () => {
      expect(isOverDecimalLimit("123.456")).toBe(true);
      expect(isOverDecimalLimit("123,456")).toBe(true);
    });

    it("should return false for values within limit", () => {
      expect(isOverDecimalLimit("123.45")).toBe(false);
      expect(isOverDecimalLimit("123.4")).toBe(false);
      expect(isOverDecimalLimit("123")).toBe(false);
    });
  });

  describe("trimTrailingZeros", () => {
    it("should remove trailing zeros", () => {
      expect(trimTrailingZeros("123.4500")).toBe("123.45");
      expect(trimTrailingZeros("123.0000")).toBe("123");
      expect(trimTrailingZeros("123,4500")).toBe("123,45");
    });

    it("should not modify values without trailing zeros", () => {
      expect(trimTrailingZeros("123.45")).toBe("123.45");
      expect(trimTrailingZeros("123")).toBe("123");
    });
  });
});

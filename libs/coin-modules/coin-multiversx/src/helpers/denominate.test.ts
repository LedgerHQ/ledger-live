import { denominate, DenominateType } from "./denominate";

describe("denominate", () => {
  describe("basic functionality", () => {
    it("returns '...' when input is '...'", () => {
      const result = denominate({ input: "..." });
      expect(result).toBe("...");
    });

    it("returns '0' for empty string input", () => {
      const result = denominate({ input: "" });
      expect(result).toBe("0");
    });

    it("returns '0' for '0' input", () => {
      const result = denominate({ input: "0" });
      expect(result).toBe("0");
    });

    it("returns '0' for undefined input", () => {
      const result = denominate({ input: undefined as unknown as string });
      expect(result).toBe("0");
    });
  });

  describe("denomination formatting", () => {
    it("formats 1 EGLD (18 decimals) correctly", () => {
      const result = denominate({
        input: "1000000000000000000",
        denomination: 18,
        decimals: 2,
      });
      expect(result).toBe("1");
    });

    it("formats 0.5 EGLD correctly", () => {
      const result = denominate({
        input: "500000000000000000",
        denomination: 18,
        decimals: 2,
      });
      // With 2 decimals, shows "0.50" but strips trailing zeros if all decimals are zero
      expect(result).toBe("0.50");
    });

    it("formats with 4 decimal places", () => {
      const result = denominate({
        input: "1234567890000000000",
        denomination: 18,
        decimals: 4,
      });
      expect(result).toBe("1.2345");
    });

    it("formats large amounts with commas", () => {
      const result = denominate({
        input: "1234567000000000000000000",
        denomination: 18,
        decimals: 2,
        addCommas: true,
      });
      expect(result).toBe("1,234,567");
    });

    it("formats without commas when addCommas is false", () => {
      const result = denominate({
        input: "1234567000000000000000000",
        denomination: 18,
        decimals: 2,
        addCommas: false,
      });
      expect(result).toBe("1234567");
    });
  });

  describe("showLastNonZeroDecimal option", () => {
    it("shows decimal places up to decimals parameter when showLastNonZeroDecimal is false", () => {
      const result = denominate({
        input: "100000000000000000",
        denomination: 18,
        decimals: 4,
        showLastNonZeroDecimal: false,
      });
      // Shows 4 decimal places as specified
      expect(result).toBe("0.1000");
    });

    it("shows last non-zero decimal when option is true", () => {
      const result = denominate({
        input: "123456789012345678",
        denomination: 18,
        decimals: 2,
        showLastNonZeroDecimal: true,
      });
      // Should show more decimals up to the last non-zero
      expect(result).toContain("0.12");
    });
  });

  describe("edge cases", () => {
    it("handles very small amounts", () => {
      const result = denominate({
        input: "1",
        denomination: 18,
        decimals: 18,
        addCommas: false,
      });
      expect(result).toBe("0.000000000000000001");
    });

    it("handles zero denomination", () => {
      const result = denominate({
        input: "12345",
        denomination: 0,
        decimals: 2,
      });
      expect(result).toBe("12,345");
    });

    it("handles zero decimals", () => {
      const result = denominate({
        input: "1500000000000000000",
        denomination: 18,
        decimals: 0,
      });
      // 1.5 EGLD with 0 decimals = 1 (truncated)
      expect(result).toBe("1");
    });

    it("pads with zeros when input is shorter than denomination", () => {
      const result = denominate({
        input: "100",
        denomination: 18,
        decimals: 4,
      });
      expect(result).toBe("0");
    });
  });

  describe("default values", () => {
    it("uses default denomination of 18", () => {
      const result = denominate({
        input: "1000000000000000000",
      });
      expect(result).toBe("1");
    });

    it("uses default decimals of 2", () => {
      const result = denominate({
        input: "1234567890123456789",
      });
      expect(result).toContain("1.23");
    });

    it("uses addCommas true by default", () => {
      const result = denominate({
        input: "1234567890000000000000000",
      });
      expect(result).toContain(",");
    });
  });
});

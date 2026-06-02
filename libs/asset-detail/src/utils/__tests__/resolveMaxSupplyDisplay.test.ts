import {
  resolveMaxSupplyDisplay,
  INFINITE_SUPPLY_SYMBOL,
  MISSING_VALUE,
} from "../resolveMaxSupplyDisplay";

describe("resolveMaxSupplyDisplay", () => {
  const formatValue = (value: number) => `${value} BTC`;

  describe("with a finite max supply", () => {
    it("formats the value through the provided formatter", () => {
      const result = resolveMaxSupplyDisplay({
        maxSupply: 21_000_000,
        circulatingSupply: 19_500_000,
        formatValue,
      });

      expect(result).toBe("21000000 BTC");
    });
  });

  describe("with no max supply", () => {
    it("returns the infinite symbol when circulating supply is present (uncapped coin)", () => {
      const result = resolveMaxSupplyDisplay({
        maxSupply: undefined,
        circulatingSupply: 120_000_000,
        formatValue,
      });

      expect(result).toBe(INFINITE_SUPPLY_SYMBOL);
    });

    it("treats a 0 max supply as infinite when circulating supply is present", () => {
      const result = resolveMaxSupplyDisplay({
        maxSupply: 0,
        circulatingSupply: 120_000_000,
        formatValue,
      });

      expect(result).toBe(INFINITE_SUPPLY_SYMBOL);
    });

    it("returns the missing-value placeholder when no market data is available", () => {
      const result = resolveMaxSupplyDisplay({
        maxSupply: undefined,
        circulatingSupply: undefined,
        formatValue,
      });

      expect(result).toBe(MISSING_VALUE);
    });

    it("returns the missing-value placeholder when circulating supply is 0", () => {
      const result = resolveMaxSupplyDisplay({
        maxSupply: 0,
        circulatingSupply: 0,
        formatValue,
      });

      expect(result).toBe(MISSING_VALUE);
    });
  });
});

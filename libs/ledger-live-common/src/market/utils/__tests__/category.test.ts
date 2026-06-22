import {
  STOCK_MARKET_CATEGORY,
  getMarketCategoriesParam,
  isBuiltInMarketListCategory,
  parseMarketListCategory,
} from "../category";

describe("market category utils", () => {
  describe("parseMarketListCategory", () => {
    it.each(["all", "starred", "stocks"])("accepts the known category %s", category => {
      expect(parseMarketListCategory(category)).toBe(category);
    });

    it("normalizes case and surrounding whitespace", () => {
      expect(parseMarketListCategory("  Stocks ")).toBe("stocks");
    });

    it("returns undefined for unknown or non-string values", () => {
      expect(parseMarketListCategory("trending")).toBeUndefined();
      expect(parseMarketListCategory(undefined)).toBeUndefined();
      expect(parseMarketListCategory(42)).toBeUndefined();
    });
  });

  describe("isBuiltInMarketListCategory", () => {
    it.each(["all", "starred", "stocks"] as const)("is true for the built-in %s", category => {
      expect(isBuiltInMarketListCategory(category)).toBe(true);
    });

    it("is false for a trending category id", () => {
      expect(isBuiltInMarketListCategory("infrastructure")).toBe(false);
    });
  });

  describe("getMarketCategoriesParam", () => {
    it.each(["all", "starred"] as const)("returns undefined for the built-in %s", category => {
      expect(getMarketCategoriesParam(category)).toBeUndefined();
    });

    it("maps the stocks built-in to the dedicated CVS category", () => {
      expect(getMarketCategoriesParam("stocks")).toBe(STOCK_MARKET_CATEGORY);
    });

    it("returns the id itself for a trending category", () => {
      expect(getMarketCategoriesParam("infrastructure")).toBe("infrastructure");
    });
  });
});

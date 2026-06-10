import type { MarketCurrencyData } from "../types";
import {
  STOCK_MARKET_FILTER,
  getMarketCategoriesParam,
  getMarketFilter,
  isBuiltInMarketListCategory,
  isStockMarketCurrency,
  parseMarketListCategory,
} from "../category";

const currency = (id: string, name: string): MarketCurrencyData =>
  ({ id, name }) as MarketCurrencyData;

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

  describe("getMarketFilter", () => {
    it("returns the stock filter only for the stocks category", () => {
      expect(getMarketFilter(true)).toBe(STOCK_MARKET_FILTER);
      expect(getMarketFilter(false)).toBeUndefined();
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
    it.each(["all", "starred", "stocks"] as const)(
      "returns undefined for the built-in %s",
      category => {
        expect(getMarketCategoriesParam(category)).toBeUndefined();
      },
    );

    it("returns the id itself for a trending category", () => {
      expect(getMarketCategoriesParam("infrastructure")).toBe("infrastructure");
    });
  });

  describe("isStockMarketCurrency", () => {
    it.each([
      currency("apple-xstock", "Apple xStock"),
      currency("tokenized-stock-tsla", "Tesla"),
      currency("foo", "PreStocks Nvidia"),
    ])("matches tokenized stock currency %o", item => {
      expect(isStockMarketCurrency(item)).toBe(true);
    });

    it("does not match regular crypto currencies", () => {
      expect(isStockMarketCurrency(currency("bitcoin", "Bitcoin"))).toBe(false);
    });
  });
});

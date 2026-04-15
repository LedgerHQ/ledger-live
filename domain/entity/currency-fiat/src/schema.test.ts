import { FiatCurrencySchema } from "./schema";
import { mockFiatCurrency } from "./schema.mock";

describe("FiatCurrencySchema", () => {
  it("parses a valid fiat currency from mock factory", () => {
    const result = FiatCurrencySchema.parse(mockFiatCurrency());
    expect(result.id).toBe("usd");
    expect(result.type).toBe("FiatCurrency");
  });

  it("requires at least one unit", () => {
    expect(() => FiatCurrencySchema.parse(mockFiatCurrency({ units: [] }))).toThrow();
  });

  it("rejects missing required fields", () => {
    const { ticker: _, ...withoutTicker } = mockFiatCurrency();
    expect(() => FiatCurrencySchema.parse(withoutTicker)).toThrow();
  });

  it("rejects wrong type discriminant", () => {
    expect(() =>
      FiatCurrencySchema.parse({ ...mockFiatCurrency(), type: "CryptoCurrency" }),
    ).toThrow();
  });

  it("accepts optional fields when provided", () => {
    const result = FiatCurrencySchema.parse(
      mockFiatCurrency({ symbol: "€", disableCountervalue: true, keywords: ["euro", "eur"] }),
    );
    expect(result.symbol).toBe("€");
    expect(result.disableCountervalue).toBe(true);
    expect(result.keywords).toEqual(["euro", "eur"]);
  });

  it("optional fields default to undefined", () => {
    const result = FiatCurrencySchema.parse({
      type: "FiatCurrency",
      id: "eur",
      name: "Euro",
      ticker: "EUR",
      units: [{ name: "Euro", code: "EUR", magnitude: 2 }],
    });
    expect(result.symbol).toBeUndefined();
    expect(result.disableCountervalue).toBeUndefined();
    expect(result.keywords).toBeUndefined();
  });
});

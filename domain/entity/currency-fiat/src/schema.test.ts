import { FiatCurrencySchema, FiatCurrencyTickerSchema } from "./schema";
import { mockFiatCurrency } from "./schema.mock";

describe("FiatCurrencyTickerSchema", () => {
  it("accepts three uppercase letters", () => {
    expect(FiatCurrencyTickerSchema.parse("USD")).toBe("USD");
  });

  it.each(["usd", "US", "USDT", "XXX_UNKNOWN", ""])("rejects %p", ticker => {
    expect(() => FiatCurrencyTickerSchema.parse(ticker)).toThrow();
  });
});

describe("FiatCurrencySchema", () => {
  it("parses a valid fiat currency from mock factory", () => {
    const result = FiatCurrencySchema.parse(mockFiatCurrency());
    expect(result.type).toBe("FiatCurrency");
    expect(result.ticker).toBe("USD");
  });

  it("requires at least one unit", () => {
    expect(() => FiatCurrencySchema.parse(mockFiatCurrency({ units: [] }))).toThrow();
  });

  it("rejects missing required fields", () => {
    const { ticker: _, ...withoutTicker } = mockFiatCurrency();
    expect(() => FiatCurrencySchema.parse(withoutTicker)).toThrow();
  });

  it.each(["usd", "US", "XXX_UNKNOWN"])("rejects the ticker %p", ticker => {
    expect(() => FiatCurrencySchema.parse({ ...mockFiatCurrency(), ticker })).toThrow();
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
      name: "Euro",
      ticker: "EUR",
      units: [{ name: "Euro", code: "EUR", magnitude: 2 }],
    });
    expect(result.symbol).toBeUndefined();
    expect(result.disableCountervalue).toBeUndefined();
    expect(result.keywords).toBeUndefined();
  });
});

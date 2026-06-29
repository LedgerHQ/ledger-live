import { resolveSupportedFiats } from "./converter";
import { fiatByTicker } from "./fixtures";

describe("resolveSupportedFiats", () => {
  it("resolves known tickers to FiatCurrency entities, preserving order", () => {
    const result = resolveSupportedFiats(["USD", "EUR", "GBP"]);

    expect(result.map(c => c.ticker)).toEqual(["USD", "EUR", "GBP"]);
    expect(result[0]).toEqual(fiatByTicker("USD"));
  });

  it("filters out OFAC-sanctioned tickers", () => {
    const result = resolveSupportedFiats(["USD", "RUB", "IRR", "EUR"]);

    expect(result.map(c => c.ticker)).toEqual(["USD", "EUR"]);
  });

  it("drops tickers the registry does not know", () => {
    const result = resolveSupportedFiats(["USD", "ZZZ", "EUR"]);

    expect(result.map(c => c.ticker)).toEqual(["USD", "EUR"]);
  });

  it("normalizes lower-case tickers before resolving", () => {
    const result = resolveSupportedFiats(["usd", "eur"]);

    expect(result.map(c => c.ticker)).toEqual(["USD", "EUR"]);
  });

  it("de-duplicates by currency id", () => {
    const result = resolveSupportedFiats(["USD", "usd", "USD"]);

    expect(result).toHaveLength(1);
    expect(result[0].ticker).toBe("USD");
  });

  it("returns an empty array for an empty input", () => {
    expect(resolveSupportedFiats([])).toEqual([]);
  });
});

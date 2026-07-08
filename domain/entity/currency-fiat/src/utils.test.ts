import { findFiatCurrencyByTicker } from "./utils";

describe("findFiatCurrencyByTicker", () => {
  it("resolves a known ticker", () => {
    expect(findFiatCurrencyByTicker("USD")?.id).toBe("usd");
  });

  it("returns undefined for an unknown ticker", () => {
    expect(findFiatCurrencyByTicker("ZZZ")).toBeUndefined();
  });

  it("returns undefined for prototype keys like 'constructor'", () => {
    expect(findFiatCurrencyByTicker("constructor")).toBeUndefined();
  });
});

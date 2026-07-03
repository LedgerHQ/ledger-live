import { getFiatCurrencyByTicker } from "./registry";

describe("getFiatCurrencyByTicker", () => {
  it("resolves a known ticker", () => {
    expect(getFiatCurrencyByTicker("USD")?.id).toBe("usd");
  });

  it("returns undefined for an unknown ticker", () => {
    expect(getFiatCurrencyByTicker("ZZZ")).toBeUndefined();
  });
});

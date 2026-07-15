import {
  findFiatCurrencyByTicker,
  getFiatCurrencyByTicker,
  hasFiatCurrencyTicker,
  listFiatCurrencies,
} from "./utils";

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

describe("getFiatCurrencyByTicker", () => {
  it("resolves a known ticker to its registry object", () => {
    const usd = getFiatCurrencyByTicker("USD");
    expect(usd.id).toBe("usd");
    expect(usd.ticker).toBe("USD");
  });

  it("throws for an unknown ticker", () => {
    expect(() => getFiatCurrencyByTicker("ZZZ")).toThrow('fiat currency "ZZZ" not found');
  });

  it("throws for prototype keys like 'constructor'", () => {
    expect(() => getFiatCurrencyByTicker("constructor")).toThrow();
  });
});

describe("hasFiatCurrencyTicker", () => {
  it("is true for a known ticker", () => {
    expect(hasFiatCurrencyTicker("USD")).toBe(true);
  });

  it("is false for an unknown ticker", () => {
    expect(hasFiatCurrencyTicker("ZZZ")).toBe(false);
  });

  it("is false for prototype keys", () => {
    expect(hasFiatCurrencyTicker("constructor")).toBe(false);
  });
});

describe("listFiatCurrencies", () => {
  it("returns a non-empty array", () => {
    expect(listFiatCurrencies().length).toBeGreaterThan(0);
  });

  it("includes USD", () => {
    expect(listFiatCurrencies().some(c => c.ticker === "USD")).toBe(true);
  });

  it("returns the same registry object references (not copies)", () => {
    const usd = listFiatCurrencies().find(c => c.ticker === "USD");
    expect(usd).toBe(getFiatCurrencyByTicker("USD"));
  });
});

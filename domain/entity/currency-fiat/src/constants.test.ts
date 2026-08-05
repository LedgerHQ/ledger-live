import * as currencies from "./currencies";
import {
  FIAT_CURRENCIES_REGISTRY,
  FIAT_CURRENCIES_TICKERS,
  FIAT_CURRENCIES_BY_TICKER,
} from "./constants";

describe("FIAT_CURRENCIES_REGISTRY", () => {
  it("is non-empty", () => {
    expect(Object.keys(FIAT_CURRENCIES_REGISTRY).length).toBeGreaterThan(0);
  });

  it("has no duplicate tickers across currency files", () => {
    const seen = new Map<string, string>();
    for (const [varName, currency] of Object.entries(currencies)) {
      const existing = seen.get(currency.ticker);
      expect(existing).toBeUndefined();
      seen.set(currency.ticker, varName);
    }
  });

  it("every entry is keyed by its own ticker", () => {
    for (const [key, currency] of Object.entries(FIAT_CURRENCIES_REGISTRY)) {
      expect(currency.ticker).toBe(key);
    }
  });

  it("every entry has type FiatCurrency and a non-empty ticker", () => {
    for (const currency of Object.values(FIAT_CURRENCIES_REGISTRY)) {
      expect(currency.type).toBe("FiatCurrency");
      expect(currency.ticker.length).toBeGreaterThan(0);
    }
  });
});

describe("FIAT_CURRENCIES_TICKERS", () => {
  it("length matches registry", () => {
    expect(FIAT_CURRENCIES_TICKERS.length).toBe(Object.keys(FIAT_CURRENCIES_REGISTRY).length);
  });
});

describe("FIAT_CURRENCIES_BY_TICKER", () => {
  it("has no duplicate tickers across currency files", () => {
    const tickers = Object.values(currencies).map(c => c.ticker);
    expect(new Set(tickers).size).toBe(tickers.length);
  });

  it("every entry is keyed by its own ticker", () => {
    for (const [key, currency] of Object.entries(FIAT_CURRENCIES_BY_TICKER)) {
      expect(currency.ticker).toBe(key);
    }
  });
});

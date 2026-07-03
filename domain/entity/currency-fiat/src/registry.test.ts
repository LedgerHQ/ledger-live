import * as currencies from "./currencies";
import {
  FIAT_CURRENCIES_REGISTRY,
  FIAT_CURRENCIES_IDS,
  FIAT_CURRENCIES_BY_TICKER,
} from "./constants";
import { getFiatCurrencyByTicker } from "./registry";

describe("FIAT_CURRENCIES_REGISTRY", () => {
  it("is non-empty", () => {
    expect(Object.keys(FIAT_CURRENCIES_REGISTRY).length).toBeGreaterThan(0);
  });

  it("has no duplicate ids across currency files", () => {
    const seen = new Map<string, string>();
    for (const [varName, currency] of Object.entries(currencies)) {
      const existing = seen.get(currency.id);
      expect(existing).toBeUndefined();
      seen.set(currency.id, varName);
    }
  });

  it("every entry is keyed by its own id", () => {
    for (const [key, currency] of Object.entries(FIAT_CURRENCIES_REGISTRY)) {
      expect(currency.id).toBe(key);
    }
  });

  it("every entry has type FiatCurrency and a non-empty id", () => {
    for (const currency of Object.values(FIAT_CURRENCIES_REGISTRY)) {
      expect(currency.type).toBe("FiatCurrency");
      expect(currency.id.length).toBeGreaterThan(0);
    }
  });
});

describe("FIAT_CURRENCIES_IDS", () => {
  it("length matches registry", () => {
    expect(FIAT_CURRENCIES_IDS.length).toBe(Object.keys(FIAT_CURRENCIES_REGISTRY).length);
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

describe("getFiatCurrencyByTicker", () => {
  it("resolves a known ticker", () => {
    expect(getFiatCurrencyByTicker("USD")?.id).toBe("usd");
  });

  it("returns undefined for an unknown ticker", () => {
    expect(getFiatCurrencyByTicker("ZZZ")).toBeUndefined();
  });
});

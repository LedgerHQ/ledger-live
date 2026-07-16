import { buildFallbackFiats } from "./internals";
import { OFAC_FIAT_TICKERS, FALLBACK_FIAT_TICKERS } from "./constants";

describe("buildFallbackFiats", () => {
  it("returns a non-empty list", () => {
    expect(buildFallbackFiats().length).toBeGreaterThan(0);
  });

  it("every entry is a valid FiatCurrency", () => {
    for (const currency of buildFallbackFiats()) {
      expect(currency.type).toBe("FiatCurrency");
      expect(currency.ticker.length).toBeGreaterThan(0);
    }
  });

  it("excludes all OFAC-restricted tickers", () => {
    const tickers = buildFallbackFiats().map(c => c.ticker);
    for (const blocked of OFAC_FIAT_TICKERS) {
      expect(tickers).not.toContain(blocked);
    }
  });

  it("excludes RUB which appears in both FALLBACK_FIAT_TICKERS and OFAC_FIAT_TICKERS", () => {
    expect(FALLBACK_FIAT_TICKERS).toContain("RUB");
    const tickers = buildFallbackFiats().map(c => c.ticker);
    expect(tickers).not.toContain("RUB");
  });

  it("includes USD and EUR", () => {
    const tickers = buildFallbackFiats().map(c => c.ticker);
    expect(tickers).toContain("USD");
    expect(tickers).toContain("EUR");
  });
});

import type { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { applyDadaMarketFallback } from "../applyDadaMarketFallback";

const baseMarket = (overrides: Partial<MarketCurrencyData> = {}): MarketCurrencyData =>
  ({
    id: "bitcoin",
    ledgerIds: ["bitcoin"],
    name: "Bitcoin",
    ticker: "BTC",
    price: 50_000,
    circulatingSupply: 19_500_000,
    totalSupply: 19_500_000,
    maxSupply: 21_000_000,
    ...overrides,
  }) as MarketCurrencyData;

describe("applyDadaMarketFallback", () => {
  it("returns DADA values verbatim when all merged fields are present", () => {
    const dada = baseMarket();
    const cg = baseMarket({
      ticker: "XXX",
      circulatingSupply: 999,
      totalSupply: 999,
      maxSupply: 999,
    });
    const out = applyDadaMarketFallback(dada, cg);

    expect(out.ticker).toBe("BTC");
    expect(out.circulatingSupply).toBe(19_500_000);
    expect(out.totalSupply).toBe(19_500_000);
    expect(out.maxSupply).toBe(21_000_000);
  });

  it("falls back to CoinGecko ticker when DADA returns an empty string", () => {
    const dada = baseMarket({ ticker: "" });
    const cg = baseMarket({ ticker: "XRP" });
    const out = applyDadaMarketFallback(dada, cg);

    expect(out.ticker).toBe("XRP");
  });

  it("falls back to CoinGecko when DADA returns 0 for a supply cap", () => {
    const dada = baseMarket({ maxSupply: 0 });
    const cg = baseMarket({ maxSupply: 21_000_000 });
    const out = applyDadaMarketFallback(dada, cg);

    expect(out.maxSupply).toBe(21_000_000);
  });

  it("falls back to CoinGecko for circulatingSupply and totalSupply when DADA returns 0", () => {
    const dada = baseMarket({ circulatingSupply: 0, totalSupply: 0 });
    const cg = baseMarket({ circulatingSupply: 19_500_000, totalSupply: 19_500_000 });
    const out = applyDadaMarketFallback(dada, cg);

    expect(out.circulatingSupply).toBe(19_500_000);
    expect(out.totalSupply).toBe(19_500_000);
  });

  it("defaults ticker to an empty string when both sources are missing", () => {
    const dada = baseMarket({ ticker: "" });
    const out = applyDadaMarketFallback(dada, undefined);

    expect(out.ticker).toBe("");
  });

  it("leaves maxSupply/totalSupply undefined when both sources are missing", () => {
    const dada = baseMarket({ maxSupply: 0, totalSupply: 0 });
    const out = applyDadaMarketFallback(dada, undefined);

    expect(out.maxSupply).toBeUndefined();
    expect(out.totalSupply).toBeUndefined();
  });

  it("defaults circulatingSupply to 0 when both sources are missing", () => {
    const dada = baseMarket({ circulatingSupply: 0 });
    const out = applyDadaMarketFallback(dada, undefined);

    expect(out.circulatingSupply).toBe(0);
  });

  it("preserves all non-merged fields from DADA", () => {
    const dada = baseMarket({ price: 12_345, marketcap: 1_000 });
    const cg = baseMarket({ price: 1, marketcap: 1 });
    const out = applyDadaMarketFallback(dada, cg);

    expect(out.price).toBe(12_345);
    expect(out.marketcap).toBe(1_000);
  });
});

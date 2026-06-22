import type { Unit } from "@ledgerhq/types-cryptoassets";
import { mapDadaMarketToDisplayData } from "../mapDadaMarketToDisplayData";

const usd = { name: "US Dollar", code: "USD", magnitude: 2 } as Unit;
const t = ((key: string) => key) as never;
const options = {
  counterCurrency: "usd",
  counterValueUnit: usd,
  usdToFiatRate: 1,
  locale: "en",
  t,
};
const meta = { id: "meta:bitcoin", name: "Bitcoin", ticker: "btc", ledgerId: "bitcoin" };

const market = {
  id: "bitcoin",
  name: "Bitcoin",
  ticker: "BTC",
  ledgerIds: ["bitcoin"],
  price: 92000,
  marketCap: 1_800_000_000_000,
  marketCapRank: 1,
  priceChangePercentage24h: 7.87,
};

describe("mapDadaMarketToDisplayData", () => {
  it("maps market fields and uppercases the ticker", () => {
    const result = mapDadaMarketToDisplayData(
      meta,
      {
        id: "bitcoin",
        name: "Bitcoin",
        ticker: "BTC",
        ledgerIds: ["bitcoin"],
        price: 92000,
        marketCap: 1_800_000_000_000,
        marketCapRank: 1,
        priceChangePercentage24h: 7.87,
      },
      options,
    );

    expect(result.id).toBe("bitcoin");
    expect(result.ticker).toBe("BTC");
    expect(result.ledgerIds).toEqual(["bitcoin"]);
    expect(result.marketcapRank).toBe(1);
    expect(result.priceChangePercentage).toBeCloseTo(7.87);
    expect(result.formattedMarketCap).not.toBe("-");
    expect(result.formattedPrice).toMatch(/\d/);
  });

  it("falls back to meta and safe defaults when market data is missing", () => {
    const result = mapDadaMarketToDisplayData(meta, undefined, options);

    expect(result.id).toBe("bitcoin");
    expect(result.name).toBe("Bitcoin");
    expect(result.ticker).toBe("BTC");
    expect(result.ledgerIds).toEqual(["bitcoin"]);
    expect(result.marketcapRank).toBe(0);
    expect(result.priceChangePercentage).toBe(0);
    expect(result.formattedMarketCap).toBe("-");
  });

  it("converts the USD price and market cap by the usd→fiat rate", () => {
    const atRate1 = mapDadaMarketToDisplayData(meta, market, { ...options, usdToFiatRate: 1 });
    const atRate2 = mapDadaMarketToDisplayData(meta, market, { ...options, usdToFiatRate: 2 });

    expect(atRate2.formattedPrice).not.toBe(atRate1.formattedPrice);
    expect(atRate2.formattedMarketCap).not.toBe(atRate1.formattedMarketCap);
  });

  it("shows '-' while the usd→fiat rate is unresolved", () => {
    const result = mapDadaMarketToDisplayData(meta, market, { ...options, usdToFiatRate: null });

    expect(result.formattedPrice).toBe("-");
    expect(result.formattedMarketCap).toBe("-");
  });
});

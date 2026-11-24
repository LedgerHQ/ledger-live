import { MarketCurrencySchema, MarketListQueryArgSchema } from "./schema";
import { KeysPriceChange } from "./types";

const marketCurrency = {
  id: "bitcoin",
  ledgerIds: ["bitcoin"],
  name: "Bitcoin",
  marketcapRank: 1,
  totalVolume: 1000,
  high24h: 110,
  low24h: 90,
  ticker: "btc",
  price: 100,
  priceChangePercentage: {
    [KeysPriceChange.hour]: 0.1,
    [KeysPriceChange.day]: 1,
    [KeysPriceChange.week]: 2,
    [KeysPriceChange.month]: 3,
    [KeysPriceChange.sixMonths]: 4,
    [KeysPriceChange.year]: 5,
  },
  marketCapChangePercentage24h: 1,
  circulatingSupply: 19_000_000,
  ath: 120,
  athDate: new Date("2021-11-10T00:00:00Z"),
  atl: 0.1,
  atlDate: new Date("2013-07-06T00:00:00Z"),
  chartData: { day: [[1_700_000_000_000, 100]] },
};

describe("MarketCurrencySchema", () => {
  it("validates a well-formed currency", () => {
    expect(MarketCurrencySchema.parse(marketCurrency)).toEqual(marketCurrency);
  });

  it("rejects a currency without ledger ids", () => {
    const { ledgerIds: _ledgerIds, ...withoutLedgerIds } = marketCurrency;

    expect(MarketCurrencySchema.safeParse(withoutLedgerIds).success).toBe(false);
  });

  it("rejects a currency missing a price change window", () => {
    const { [KeysPriceChange.year]: _year, ...withoutYear } = marketCurrency.priceChangePercentage;

    expect(
      MarketCurrencySchema.safeParse({
        ...marketCurrency,
        priceChangePercentage: withoutYear,
      }).success,
    ).toBe(false);
  });
});

describe("MarketListQueryArgSchema", () => {
  it("validates a query with a supported page size", () => {
    expect(MarketListQueryArgSchema.parse({ pageSize: 20, search: "bit" })).toEqual({
      pageSize: 20,
      search: "bit",
    });
  });

  it("rejects a page size the endpoint does not accept", () => {
    expect(MarketListQueryArgSchema.safeParse({ pageSize: 2 }).success).toBe(false);
  });
});

import { mockMarketItemResponse } from "./marketItem.mock";
import { formatMarketCurrencies, formatMarketCurrency } from "./transforms";

describe("formatMarketCurrency", () => {
  it("maps the raw market item to the app-facing currency", () => {
    const currency = formatMarketCurrency(mockMarketItemResponse());

    expect(currency).toEqual(
      expect.objectContaining({
        id: "bitcoin",
        ledgerIds: ["bitcoin"],
        name: "Bitcoin",
        ticker: "BTC",
        price: 63_250,
        marketcap: 1_250_000_000_000,
        marketcapRank: 1,
        ath: 69000,
        chartData: {},
      }),
    );
  });

  it("keys the price changes by window and defaults the 6-month change to 0", () => {
    const currency = formatMarketCurrency(
      mockMarketItemResponse({ priceChangePercentage6m: undefined }),
    );

    expect(currency.priceChangePercentage).toEqual({
      "1h": 0.12,
      "24h": -0.64,
      "7d": 1.9,
      "30d": 4.3,
      "6m": 0,
      "1y": 48.2,
    });
  });

  it("parses the all-time dates", () => {
    const currency = formatMarketCurrency(mockMarketItemResponse());

    expect(currency.athDate).toEqual(new Date("2021-11-10T14:24:11.000Z"));
    expect(currency.atlDate).toEqual(new Date("2013-07-06T00:00:00.000Z"));
  });
});

describe("formatMarketCurrencies", () => {
  it("maps every item and keeps the order", () => {
    const list = formatMarketCurrencies([
      mockMarketItemResponse({ id: "ethereum" }),
      mockMarketItemResponse({ id: "bitcoin" }),
    ]);

    expect(list.map(currency => currency.id)).toEqual(["ethereum", "bitcoin"]);
  });
});

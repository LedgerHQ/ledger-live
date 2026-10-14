import { applyUsdRateToMarket, applyUsdRateToMarketItem } from "../applyUsdRateToMarket";
import { createMockMarketCurrencyData, createMockMarketItemResponse } from "../fixtures";

const scale = (value: number, rate: number) => value * rate;

describe("applyUsdRateToMarket", () => {
  it("returns the same reference when the rate is 1", () => {
    const data = createMockMarketCurrencyData();
    expect(applyUsdRateToMarket(data, 1)).toBe(data);
  });

  it("scales USD amounts and keeps every other field", () => {
    const data = createMockMarketCurrencyData();
    const rate = 0.9;

    expect(applyUsdRateToMarket(data, rate)).toEqual({
      ...data,
      price: scale(data.price, rate),
      marketcap: scale(data.marketcap as number, rate),
      totalVolume: scale(data.totalVolume, rate),
      high24h: scale(data.high24h, rate),
      low24h: scale(data.low24h, rate),
      ath: scale(data.ath, rate),
      atl: scale(data.atl, rate),
    });
  });

  it("keeps marketcap undefined when the input has none", () => {
    const data = createMockMarketCurrencyData({ marketcap: undefined });
    expect(applyUsdRateToMarket(data, 2).marketcap).toBeUndefined();
  });
});

describe("applyUsdRateToMarketItem", () => {
  it("returns the same reference when the rate is 1", () => {
    const item = createMockMarketItemResponse();
    expect(applyUsdRateToMarketItem(item, 1)).toBe(item);
  });

  it("scales USD amounts and the sparkline, and keeps every other field", () => {
    const item = createMockMarketItemResponse();
    const rate = 0.5;

    expect(applyUsdRateToMarketItem(item, rate)).toEqual({
      ...item,
      price: scale(item.price, rate),
      high24h: scale(item.high24h, rate),
      low24h: scale(item.low24h, rate),
      marketCap: scale(item.marketCap, rate),
      marketCapChange24h: scale(item.marketCapChange24h, rate),
      fullyDilutedValuation: scale(item.fullyDilutedValuation, rate),
      totalVolume: scale(item.totalVolume, rate),
      allTimeHigh: scale(item.allTimeHigh, rate),
      allTimeLow: scale(item.allTimeLow, rate),
      priceChange24h: scale(item.priceChange24h, rate),
      sparkline: item.sparkline.map(value => scale(value, rate)),
    });
  });
});

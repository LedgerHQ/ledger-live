import type { MarketCurrencyData, MarketItemResponse } from "./types";

/**
 * Convert the USD-denominated fields of a {@link MarketCurrencyData} into the
 * user's fiat by multiplying by `rate` (e.g., USD→EUR rate). Non-USD fields
 * (percentages, dates, supplies, sparkline, chartData) are preserved unchanged.
 */
export function applyUsdRateToMarket(data: MarketCurrencyData, rate: number): MarketCurrencyData {
  if (rate === 1) return data;

  return {
    ...data,
    price: data.price * rate,
    marketcap: data.marketcap != null ? data.marketcap * rate : data.marketcap,
    totalVolume: data.totalVolume * rate,
    high24h: data.high24h * rate,
    low24h: data.low24h * rate,
    ath: data.ath * rate,
    atl: data.atl * rate,
  };
}

/**
 * Convert the USD-denominated fields of a raw market row into the user's
 * countervalue. Percentages, supplies, ranks and dates stay unchanged.
 */
export function applyUsdRateToMarketItem(
  item: MarketItemResponse,
  rate: number,
): MarketItemResponse {
  if (rate === 1) return item;

  const scale = (value: number) => value * rate;
  return {
    ...item,
    price: scale(item.price),
    high24h: scale(item.high24h),
    low24h: scale(item.low24h),
    marketCap: scale(item.marketCap),
    marketCapChange24h: scale(item.marketCapChange24h),
    fullyDilutedValuation: scale(item.fullyDilutedValuation),
    totalVolume: scale(item.totalVolume),
    allTimeHigh: scale(item.allTimeHigh),
    allTimeLow: scale(item.allTimeLow),
    priceChange24h: scale(item.priceChange24h),
    sparkline: item.sparkline.map(scale),
  };
}

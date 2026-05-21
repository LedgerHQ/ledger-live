import type { MarketCurrencyData } from "./types";

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

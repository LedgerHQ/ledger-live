import { KeysPriceChange, type MarketCurrency } from "@domain/entity-market-currency";
import type { MarketItemResponse } from "./types";
import { distributedCopy, toSparklineSvgData } from "./internals/sparkline";

/** Sparklines keep 6 points per day of the week. */
const SPARKLINE_POINTS_IN_7D = 6 * 7;

/** Maps one raw `/v3/markets` item to the app-facing {@link MarketCurrency}. */
export function formatMarketCurrency(currency: MarketItemResponse): MarketCurrency {
  return {
    id: currency.id,
    ledgerIds: currency.ledgerIds,
    name: currency.name,
    image: currency.image,
    marketcap: currency.marketCap,
    marketcapRank: currency.marketCapRank,
    totalVolume: currency.totalVolume,
    high24h: currency.high24h,
    low24h: currency.low24h,
    ticker: currency.ticker,
    price: currency.price,
    priceChangePercentage: {
      [KeysPriceChange.hour]: currency.priceChangePercentage1h,
      [KeysPriceChange.day]: currency.priceChangePercentage24h,
      [KeysPriceChange.week]: currency.priceChangePercentage7d,
      [KeysPriceChange.month]: currency.priceChangePercentage30d,
      [KeysPriceChange.sixMonths]: currency.priceChangePercentage6m ?? 0,
      [KeysPriceChange.year]: currency.priceChangePercentage1y,
    },
    marketCapChangePercentage24h: currency.marketCapChangePercentage24h,
    circulatingSupply: currency.circulatingSupply,
    totalSupply: currency.totalSupply,
    maxSupply: currency.maxSupply,
    ath: currency.allTimeHigh,
    athDate: new Date(currency.allTimeHighDate),
    atl: currency.allTimeLow,
    atlDate: new Date(currency.allTimeLowDate),
    sparklineIn7d: currency.sparkline
      ? toSparklineSvgData(distributedCopy(currency.sparkline, SPARKLINE_POINTS_IN_7D))
      : undefined,
    chartData: {},
  };
}

/** Maps a raw `/v3/markets` list, keeping its order. */
export function formatMarketCurrencies(data: MarketItemResponse[]): MarketCurrency[] {
  return data.map(formatMarketCurrency);
}

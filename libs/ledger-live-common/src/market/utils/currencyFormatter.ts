import {
  MarketCurrencyData,
  KeysPriceChange,
  MarketItemPerformer,
  MarketItemResponse,
} from "./types";

export function currencyFormatter(data: MarketItemResponse[]): MarketCurrencyData[] {
  return data.map((currency: MarketItemResponse) => format(currency));
}

export const format = (currency: MarketItemResponse): MarketCurrencyData => {
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
    chartData: {},
  };
};

export const formatPerformer = (currency: MarketItemResponse): MarketItemPerformer => ({
  id: currency.id,
  ledgerIds: currency.ledgerIds,
  name: currency.name,
  image: currency.image,
  ticker: currency.ticker,
  priceChangePercentage1h: currency.priceChangePercentage1h,
  priceChangePercentage24h: currency.priceChangePercentage24h,
  priceChangePercentage7d: currency.priceChangePercentage7d,
  priceChangePercentage30d: currency.priceChangePercentage30d,
  priceChangePercentage1y: currency.priceChangePercentage1y,
  price: currency.price,
});

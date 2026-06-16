import { KeysPriceChange, MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";

const EMPTY_PRICE_CHANGE: Record<KeysPriceChange, number> = {
  [KeysPriceChange.hour]: 0,
  [KeysPriceChange.day]: 0,
  [KeysPriceChange.week]: 0,
  [KeysPriceChange.month]: 0,
  [KeysPriceChange.sixMonths]: 0,
  [KeysPriceChange.year]: 0,
};

type BuildSearchMarketCurrencyDataParams = {
  id: string;
  name: string;
  ticker: string;
  ledgerIds: string[];
  image?: string;
  price: number;
  priceChangePercentage24h?: number;
};

export function buildSearchMarketCurrencyData({
  id,
  name,
  ticker,
  ledgerIds,
  image,
  price,
  priceChangePercentage24h,
}: BuildSearchMarketCurrencyDataParams): MarketCurrencyData {
  return {
    id,
    name,
    ticker,
    ledgerIds,
    image,
    price,
    marketcapRank: 0,
    totalVolume: 0,
    high24h: 0,
    low24h: 0,
    priceChangePercentage: {
      ...EMPTY_PRICE_CHANGE,
      [KeysPriceChange.day]: priceChangePercentage24h ?? 0,
    },
    marketCapChangePercentage24h: 0,
    circulatingSupply: 0,
    ath: 0,
    athDate: new Date(0),
    atl: 0,
    atlDate: new Date(0),
    chartData: {},
  };
}

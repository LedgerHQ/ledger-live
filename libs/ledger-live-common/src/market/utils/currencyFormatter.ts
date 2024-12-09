import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  CurrencyData,
  KeysPriceChange,
  MarketItemPerformer,
  MarketItemResponse,
  SparklineSvgData,
} from "./types";

function distributedCopy(items: number[], n: number): number[] {
  if (!items) return [];
  if (items.length <= n) return items;
  const elements = [items[0]];
  const totalItems = items.length - 2;
  const interval = Math.floor(totalItems / (n - 2));
  for (let i = 1; i < n - 1; i++) {
    elements.push(items[i * interval]);
  }
  elements.push(items[items.length - 1]);
  return elements;
}

const sparklineXMagnitude = 5;
const sparklineYHeight = 50;

function sparklineAsSvgData(points: number[]): SparklineSvgData {
  const totalXSteps = sparklineXMagnitude * points.length;
  const min = Math.min(...points);
  const max = Math.max(...points);

  const yOffset = max - min;

  return {
    path: points
      .map((d, i) => {
        const [x, y] = [
          i * sparklineXMagnitude,
          sparklineYHeight + 3 - ((d - min) * sparklineYHeight) / yOffset,
        ];
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(" "),
    viewBox: `0 0 ${totalXSteps} ${sparklineYHeight + 3}`,
    isPositive: points[0] <= points[points.length - 1],
  };
}

export function currencyFormatter(
  data: MarketItemResponse[],
  cryptoCurrenciesList: (CryptoCurrency | TokenCurrency)[],
): CurrencyData[] {
  return data.map((currency: MarketItemResponse) => format(currency, cryptoCurrenciesList));
}

export const format = (
  currency: MarketItemResponse,
  cryptoCurrenciesList: (CryptoCurrency | TokenCurrency)[],
): CurrencyData => ({
  id: currency.id,
  name: currency.name,
  image: currency.image,
  internalCurrency: cryptoCurrenciesList.find(
    ({ ticker }) => ticker.toLowerCase() === currency.ticker,
  ),
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
    ? sparklineAsSvgData(distributedCopy(currency.sparkline, 6 * 7)) // keep 6 points per day
    : undefined,
  chartData: {},
});

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

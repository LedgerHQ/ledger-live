import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { CurrencyData, RawCurrencyData, SparklineSvgData } from "../types";

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
  data: RawCurrencyData[],
  range: string,
  cryptoCurrenciesList: (CryptoCurrency | TokenCurrency)[],
  liveCoinList: string[],
): CurrencyData[] {
  return data.map((currency: RawCurrencyData) =>
    format(currency, range, cryptoCurrenciesList, liveCoinList),
  );
}

export const format = (
  currency: RawCurrencyData,
  range: string,
  cryptoCurrenciesList: (CryptoCurrency | TokenCurrency)[],
  liveCoinList: string[],
) => ({
  id: currency.id,
  name: currency.name,
  image: currency.image,
  isLiveSupported: liveCoinList.includes(currency.id),
  internalCurrency: cryptoCurrenciesList.find(
    ({ ticker }) => ticker.toLowerCase() === currency.symbol,
  ),
  marketcap: currency.market_cap,
  marketcapRank: currency.market_cap_rank,
  totalVolume: currency.total_volume,
  high24h: currency.high_24h,
  low24h: currency.low_24h,
  ticker: currency.symbol,
  price: currency.current_price,
  priceChangePercentage: currency[`price_change_percentage_${range}_in_currency`],
  marketCapChangePercentage24h: currency.market_cap_change_percentage_24h,
  circulatingSupply: currency.circulating_supply,
  totalSupply: currency.total_supply,
  maxSupply: currency.max_supply,
  ath: currency.ath,
  athDate: currency.ath_date,
  atl: currency.atl,
  atlDate: currency.atl_date,
  sparklineIn7d: currency?.sparkline_in_7d?.price
    ? sparklineAsSvgData(distributedCopy(currency.sparkline_in_7d.price, 6 * 7)) // keep 6 points per day
    : undefined,
  chartData: {},
});

import { KeysPriceChange, Order } from "@ledgerhq/live-common/market/utils/types";
import type { MarketListFilterTimeframe, MarketListSorting } from "~/reducers/types";

const SUPPORTED_SORTINGS = new Set<MarketListSorting>(["marketCap", "gainers", "losers"]);
const SUPPORTED_TIMEFRAMES = new Set<MarketListFilterTimeframe>(["1D", "7D", "30D", "6M", "1Y"]);

export function isMarketListSortingSupported(sorting: MarketListSorting): boolean {
  return SUPPORTED_SORTINGS.has(sorting);
}

export function getSupportedMarketListSorting(sorting: MarketListSorting): MarketListSorting {
  return isMarketListSortingSupported(sorting) ? sorting : "marketCap";
}

export function getSupportedMarketListTimeframe(
  timeframe: MarketListFilterTimeframe,
): MarketListFilterTimeframe {
  return SUPPORTED_TIMEFRAMES.has(timeframe) ? timeframe : "1D";
}

export function getMarketListOrder(sorting: MarketListSorting): Order {
  switch (getSupportedMarketListSorting(sorting)) {
    case "gainers":
      return Order.topGainers;
    case "losers":
      return Order.topLosers;
    case "marketCap":
    case "volume":
    default:
      return Order.MarketCapDesc;
  }
}

export function getMarketListRequestRange(timeframe: MarketListFilterTimeframe): string {
  return getMarketListDisplayRange(timeframe);
}

export function getMarketListDisplayRange(timeframe: MarketListFilterTimeframe): KeysPriceChange {
  switch (timeframe) {
    case "7D":
      return KeysPriceChange.week;
    case "30D":
      return KeysPriceChange.month;
    case "6M":
      return KeysPriceChange.sixMonths;
    case "1Y":
      return KeysPriceChange.year;
    case "1D":
    default:
      return KeysPriceChange.day;
  }
}

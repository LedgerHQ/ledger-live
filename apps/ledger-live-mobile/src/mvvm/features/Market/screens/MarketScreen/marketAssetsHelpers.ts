import type { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { isStockMarketCurrency } from "@ledgerhq/live-common/market/utils/category";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";
import { mapMarketCurrencyToDisplayData } from "../../utils/marketAssetDisplay";

const EMPTY_MARKET_DATA: MarketCurrencyData[] = [];

type DisplayRange = Parameters<typeof mapMarketCurrencyToDisplayData>[1]["range"];
type Translate = Parameters<typeof mapMarketCurrencyToDisplayData>[1]["t"];

export type EmptyState = "favorites" | "stocks" | undefined;

export function getMarketDataForDisplay(
  data: MarketCurrencyData[],
  shouldFetchAssets: boolean,
): MarketCurrencyData[] {
  return shouldFetchAssets ? data : EMPTY_MARKET_DATA;
}

export function getMarketAssets({
  marketData,
  isStocksCategory,
  counterCurrency,
  counterValueUnit,
  displayRange,
  locale,
  t,
}: {
  marketData: MarketCurrencyData[];
  isStocksCategory: boolean;
  counterCurrency: string;
  counterValueUnit: Unit;
  displayRange: DisplayRange;
  locale: string;
  t: Translate;
}): MarketAssetDisplayData[] {
  const filteredMarketData = isStocksCategory
    ? marketData.filter(isStockMarketCurrency)
    : marketData;
  const uniqueById = [...new Map(filteredMarketData.map(item => [item.id, item])).values()];

  return uniqueById.map(item =>
    mapMarketCurrencyToDisplayData(item, {
      counterCurrency,
      counterValueUnit,
      range: displayRange,
      locale,
      t,
    }),
  );
}

export function canReachEnd({
  shouldFetchAssets,
  canLoadMore,
  loading,
  isFetchingNextPage,
  isError,
}: {
  shouldFetchAssets: boolean;
  canLoadMore: boolean;
  loading: boolean;
  isFetchingNextPage: boolean;
  isError: boolean;
}): boolean {
  return shouldFetchAssets && canLoadMore && !loading && !isFetchingNextPage && !isError;
}

export function getEmptyState({
  isFavoritesCategory,
  hasFavoriteIds,
  isStocksCategory,
}: {
  isFavoritesCategory: boolean;
  hasFavoriteIds: boolean;
  isStocksCategory: boolean;
}): EmptyState {
  if (isFavoritesCategory && !hasFavoriteIds) {
    return "favorites";
  }

  if (isStocksCategory) {
    return "stocks";
  }

  return undefined;
}

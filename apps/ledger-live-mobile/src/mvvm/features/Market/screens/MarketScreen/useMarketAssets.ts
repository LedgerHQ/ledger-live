import { useCallback, useMemo } from "react";
import { useMarketData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { useMarketDataProvider } from "@ledgerhq/live-common/cg-client/hooks/useCoingeckoDataProvider";
import { useLocale, useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector } from "~/reducers/settings";
import type {
  MarketListCategory,
  MarketListFilterTimeframe,
  MarketListSorting,
} from "~/reducers/types";
import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";
import {
  getMarketListDisplayRange,
  getMarketListOrder,
  getMarketListRequestRange,
} from "./marketListFilters";
import {
  canReachEnd,
  type EmptyState,
  getEmptyState,
  getMarketAssets,
  getMarketDataForDisplay,
} from "./marketAssetsHelpers";
import { useMarketAssetCategoryState } from "./useMarketAssetCategoryState";
import {
  getNextPaginationState,
  type PaginationParams,
  useMarketAssetPagination,
} from "./useMarketAssetPagination";

const PAGE_SIZE = 20;

export type MarketAssetsParams = {
  search?: string;
  category?: MarketListCategory;
  sorting?: MarketListSorting;
  timeframe?: MarketListFilterTimeframe;
  starredMarketCoins?: string[];
};

export interface MarketAssetsResult {
  assets: MarketAssetDisplayData[];
  loading: boolean;
  isError: boolean;
  emptyState: EmptyState;
  onEndReached: () => void;
}

export function useMarketAssets({
  search = "",
  category = "all",
  sorting = "marketCap",
  timeframe = "1D",
  starredMarketCoins = [],
}: MarketAssetsParams = {}): MarketAssetsResult {
  const { locale } = useLocale();
  const { t } = useTranslation();
  const { supportedCounterCurrencies } = useMarketDataProvider();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const settingsCounterValue = counterValueCurrency.ticker.toLowerCase();
  // While the supported list is still loading we keep the user's counter value, and only fall
  // back to usd once we know it is unsupported — otherwise a request fires with usd first.
  const counterCurrency =
    supportedCounterCurrencies && !supportedCounterCurrencies.includes(settingsCounterValue)
      ? "usd"
      : settingsCounterValue;
  const counterValueUnit = counterValueCurrency.units[0];
  const normalizedSearch = search.trim();
  const {
    isFavoritesCategory,
    isStocksCategory,
    marketCategoriesParam,
    sortedFavoriteIds,
    favoriteIdsKey,
    hasFavoriteIds,
    shouldFetchAssets,
  } = useMarketAssetCategoryState({ category, normalizedSearch, starredMarketCoins });
  const paginationParams = useMemo<PaginationParams>(
    () => ({
      search: normalizedSearch,
      category,
      favoriteIdsKey,
      sorting,
      timeframe,
    }),
    [category, favoriteIdsKey, normalizedSearch, sorting, timeframe],
  );
  const { page, requestedPage, setPagination } = useMarketAssetPagination({
    params: paginationParams,
    shouldFetchAssets,
  });
  const requestRange = getMarketListRequestRange(timeframe);
  const displayRange = getMarketListDisplayRange(timeframe);
  const order = getMarketListOrder(sorting);

  const result = useMarketData({
    counterCurrency,
    range: requestRange,
    order,
    limit: PAGE_SIZE,
    liveCompatible: true,
    page: requestedPage,
    search: normalizedSearch,
    categories: marketCategoriesParam,
    starred: sortedFavoriteIds,
  });
  const marketData = getMarketDataForDisplay(result.data, shouldFetchAssets);

  const assets = useMemo(
    () =>
      getMarketAssets({
        marketData,
        counterCurrency,
        counterValueUnit,
        displayRange,
        locale,
        t,
      }),
    [counterCurrency, counterValueUnit, displayRange, locale, marketData, t],
  );

  const hasData = assets.length > 0;
  const canLoadMore = shouldFetchAssets && marketData.length >= page * PAGE_SIZE;
  const loading = shouldFetchAssets && (result.isLoading || result.isPending) && !hasData;
  const isFetchingNextPage = shouldFetchAssets && page > 1 && result.isFetching && hasData;

  const onEndReached = useCallback(() => {
    if (
      !canReachEnd({
        shouldFetchAssets,
        canLoadMore,
        loading,
        isFetchingNextPage,
        isError: result.isError,
      })
    ) {
      return;
    }

    setPagination(current => getNextPaginationState(current, paginationParams));
  }, [
    canLoadMore,
    isFetchingNextPage,
    loading,
    paginationParams,
    result.isError,
    setPagination,
    shouldFetchAssets,
  ]);

  return {
    assets,
    loading,
    isError: shouldFetchAssets && result.isError,
    emptyState: getEmptyState({ isFavoritesCategory, hasFavoriteIds, isStocksCategory }),
    onEndReached,
  };
}

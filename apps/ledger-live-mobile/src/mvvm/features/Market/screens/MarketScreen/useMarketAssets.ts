import { useCallback, useMemo } from "react";
import { useMarketData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { useUsdToFiatRate } from "@ledgerhq/live-common/counterValues/hooks/useUsdToFiatRate";
import { useResolveMarketCounterCurrency } from "@ledgerhq/live-common/market/hooks/useResolveMarketCounterCurrency";
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
  isFetchingNextPage: boolean;
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
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const settingsCounterValue = counterValueCurrency.ticker.toLowerCase();
  const {
    requestCounterCurrency,
    displayCounterCurrency = settingsCounterValue,
    needsUsdFallback,
    isResolutionLoading,
  } = useResolveMarketCounterCurrency({ counterCurrency: settingsCounterValue });
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
  const shouldFetchMarketData = shouldFetchAssets && !isResolutionLoading;
  const marketDataOptions: [] | [{ enabled: false }] = shouldFetchMarketData
    ? []
    : [{ enabled: false }];
  const usdRateOptions: [] | [{ skip: true }] =
    isResolutionLoading || !shouldFetchAssets ? [{ skip: true }] : [];
  // Passing "usd" short-circuits the rate hook to 1 without firing a request, so
  // natively served countervalues incur no extra network call.
  const { rate: usdToCounterValueRate, status: rateStatus } = useUsdToFiatRate(
    needsUsdFallback ? displayCounterCurrency : "usd",
    ...usdRateOptions,
  );
  // Withhold a rate until it resolves so we never render USD numbers formatted with
  // the countervalue's unit. `null` defers the conversion (assets stay empty + loading).
  const rate = needsUsdFallback ? usdToCounterValueRate : 1;

  const result = useMarketData(
    {
      counterCurrency: requestCounterCurrency,
      range: requestRange,
      order,
      limit: PAGE_SIZE,
      liveCompatible: true,
      page: requestedPage,
      search: normalizedSearch,
      categories: marketCategoriesParam,
      starred: sortedFavoriteIds,
    },
    ...marketDataOptions,
  );
  const marketData = getMarketDataForDisplay(result.data, shouldFetchMarketData);

  const assets = useMemo(
    () =>
      rate == null
        ? []
        : getMarketAssets({
            marketData,
            // Format with the user's countervalue (the request may have used usd as
            // a fallback, but the values are rescaled back into the countervalue).
            counterCurrency: displayCounterCurrency,
            counterValueUnit,
            rate,
            displayRange,
            locale,
            t,
          }),
    [counterValueUnit, displayCounterCurrency, displayRange, locale, marketData, rate, t],
  );

  const hasData = assets.length > 0;
  const canLoadMore = shouldFetchAssets && marketData.length >= page * PAGE_SIZE;
  const isRateLoading = needsUsdFallback && rateStatus === "loading";
  const isRateError = needsUsdFallback && rateStatus === "error";
  const loading =
    shouldFetchAssets &&
    (isResolutionLoading || result.isLoading || result.isPending || isRateLoading) &&
    !hasData;
  const isFetchingNextPage = shouldFetchAssets && page > 1 && result.isFetching && hasData;

  const onEndReached = useCallback(() => {
    if (
      !canReachEnd({
        shouldFetchAssets,
        canLoadMore,
        loading,
        isFetchingNextPage,
        isError: result.isError || isRateError,
      })
    ) {
      return;
    }

    setPagination(current => getNextPaginationState(current, paginationParams));
  }, [
    canLoadMore,
    isFetchingNextPage,
    isRateError,
    loading,
    paginationParams,
    result.isError,
    setPagination,
    shouldFetchAssets,
  ]);

  return {
    assets,
    loading,
    isFetchingNextPage,
    isError: shouldFetchAssets && (result.isError || isRateError),
    emptyState: getEmptyState({ isFavoritesCategory, hasFavoriteIds, isStocksCategory }),
    onEndReached,
  };
}

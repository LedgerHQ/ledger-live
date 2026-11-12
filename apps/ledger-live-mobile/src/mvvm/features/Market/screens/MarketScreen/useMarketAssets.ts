import { useCallback, useMemo } from "react";
import { useMarketData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { useMarketCounterValueRate } from "@ledgerhq/live-common/market/hooks/useMarketCounterValueRate";
import { resolveMarketListRefreshRate } from "@ledgerhq/live-common/market/utils/timers";
import { useFeature } from "@features/platform-feature-flags";
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
  resetToFirstPage: () => void;
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
  const counterValueUnit = counterValueCurrency.units[0];
  const normalizedSearch = search.trim();
  const {
    isFavoritesCategory,
    isStocksCategory,
    marketCategoriesParam,
    favoriteIds,
    hasFavoriteIds,
    shouldFetchAssets,
  } = useMarketAssetCategoryState({ category, normalizedSearch, starredMarketCoins });
  const {
    requestCounterCurrency,
    rate,
    isResolutionLoading,
    isLoading: isCounterValueLoading,
    isError: isCounterValueError,
  } = useMarketCounterValueRate({
    counterCurrency: settingsCounterValue,
    fallbackForCryptoCountervalues: true,
    isCryptoCountervalue: counterValueCurrency.type === "CryptoCurrency",
    skip: !shouldFetchAssets,
  });
  const requestRange = getMarketListRequestRange(timeframe);
  const displayRange = getMarketListDisplayRange(timeframe);
  const order = getMarketListOrder(sorting);
  const refreshMarketData = useFeature("llmRefreshMarketData");
  const refreshRate = resolveMarketListRefreshRate(refreshMarketData?.params?.refreshTime);
  const shouldFetchMarketData = shouldFetchAssets && !isResolutionLoading;

  const result = useMarketData(
    {
      counterCurrency: requestCounterCurrency,
      range: requestRange,
      order,
      limit: PAGE_SIZE,
      liveCompatible: true,
      search: normalizedSearch,
      categories: marketCategoriesParam,
      starred: favoriteIds,
    },
    { enabled: shouldFetchMarketData, refreshRate },
  );
  const { fetchNextPage, resetToFirstPage } = result;
  const marketData = getMarketDataForDisplay(result.data, shouldFetchMarketData);

  const assets = useMemo(
    () =>
      rate == null
        ? []
        : getMarketAssets({
            marketData,
            counterValueUnit,
            rate,
            displayRange,
            locale,
            t,
          }),
    [counterValueUnit, displayRange, locale, marketData, rate, t],
  );

  const hasData = assets.length > 0;
  const canLoadMore = shouldFetchAssets && result.hasNextPage;
  const loading =
    shouldFetchAssets &&
    (isCounterValueLoading || result.isLoading || result.isPending) &&
    !hasData;
  const isFetchingNextPage = shouldFetchAssets && result.isFetchingNextPage;

  const onEndReached = useCallback(() => {
    if (
      !canReachEnd({
        shouldFetchAssets,
        canLoadMore,
        loading,
        isFetchingNextPage,
        isError: result.isError || isCounterValueError,
      })
    ) {
      return;
    }

    fetchNextPage();
  }, [
    canLoadMore,
    fetchNextPage,
    isCounterValueError,
    isFetchingNextPage,
    loading,
    result.isError,
    shouldFetchAssets,
  ]);

  return {
    assets,
    loading,
    isFetchingNextPage,
    isError: shouldFetchAssets && (result.isError || isCounterValueError),
    emptyState: getEmptyState({ isFavoritesCategory, hasFavoriteIds, isStocksCategory }),
    onEndReached,
    resetToFirstPage,
  };
}

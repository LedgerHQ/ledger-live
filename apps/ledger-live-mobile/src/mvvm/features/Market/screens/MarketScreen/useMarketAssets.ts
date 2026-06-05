import { useCallback, useEffect, useMemo, useState } from "react";
import { useMarketData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { KeysPriceChange, Order } from "@ledgerhq/live-common/market/utils/types";
import { useLocale, useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector } from "~/reducers/settings";
import type { MarketListCategory } from "~/reducers/types";
import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";
import { mapMarketCurrencyToDisplayData } from "../../utils/marketAssetDisplay";

const DEFAULT_RANGE = KeysPriceChange.day;
const PAGE_SIZE = 20;

export type MarketAssetsParams = {
  search?: string;
  category?: MarketListCategory;
  starredMarketCoins?: string[];
};

type PaginationState = {
  page: number;
  search: string;
  category: MarketListCategory;
  favoriteIdsKey: string;
};

export interface MarketAssetsResult {
  assets: MarketAssetDisplayData[];
  loading: boolean;
  loadingMore: boolean;
  isError: boolean;
  emptyState: "favorites" | undefined;
  onEndReached: () => void;
}

export function useMarketAssets({
  search = "",
  category = "all",
  starredMarketCoins = [],
}: MarketAssetsParams = {}): MarketAssetsResult {
  const { locale } = useLocale();
  const { t } = useTranslation();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const counterCurrency = counterValueCurrency.ticker.toLowerCase();
  const counterValueUnit = counterValueCurrency.units[0];
  const normalizedSearch = search.trim();
  const hasSearch = normalizedSearch.length > 0;
  const isFavoritesCategory = !hasSearch && category === "starred";
  const sortedFavoriteIds = useMemo(
    () =>
      isFavoritesCategory
        ? [...starredMarketCoins].sort((firstId, secondId) => firstId.localeCompare(secondId))
        : undefined,
    [isFavoritesCategory, starredMarketCoins],
  );
  const favoriteIdsKey = sortedFavoriteIds?.join(",") ?? "";
  const hasFavoriteIds = Boolean(sortedFavoriteIds?.length);
  const shouldFetchAssets = !isFavoritesCategory || hasFavoriteIds;
  const [pagination, setPagination] = useState<PaginationState>(() => ({
    page: 1,
    search: normalizedSearch,
    category,
    favoriteIdsKey,
  }));
  const isPaginationSynced =
    pagination.search === normalizedSearch &&
    pagination.category === category &&
    pagination.favoriteIdsKey === favoriteIdsKey;
  const page = isPaginationSynced ? pagination.page : 1;
  const requestedPage = shouldFetchAssets ? page : 0;

  useEffect(() => {
    if (!isPaginationSynced) {
      setPagination({ page: 1, search: normalizedSearch, category, favoriteIdsKey });
    }
  }, [category, favoriteIdsKey, isPaginationSynced, normalizedSearch]);

  const result = useMarketData({
    counterCurrency,
    range: DEFAULT_RANGE,
    order: Order.MarketCapDesc,
    limit: PAGE_SIZE,
    liveCompatible: true,
    page: requestedPage,
    search: normalizedSearch,
    starred: sortedFavoriteIds,
  });

  const assets = useMemo(() => {
    const marketData = shouldFetchAssets ? result.data : [];
    const uniqueById = [...new Map(marketData.map(item => [item.id, item])).values()];
    return uniqueById.map(item =>
      mapMarketCurrencyToDisplayData(item, {
        counterCurrency,
        counterValueUnit,
        range: DEFAULT_RANGE,
        locale,
        t,
      }),
    );
  }, [shouldFetchAssets, result.data, counterCurrency, counterValueUnit, locale, t]);

  const hasData = assets.length > 0;
  const loading = shouldFetchAssets && (result.isLoading || result.isPending) && !hasData;
  const loadingMore = shouldFetchAssets && result.isFetching && hasData;

  const onEndReached = useCallback(() => {
    if (!shouldFetchAssets || !hasData || loading || loadingMore || result.isError) return;

    setPagination(current => {
      if (
        current.search !== normalizedSearch ||
        current.category !== category ||
        current.favoriteIdsKey !== favoriteIdsKey
      ) {
        return { page: 1, search: normalizedSearch, category, favoriteIdsKey };
      }

      return { ...current, page: current.page + 1 };
    });
  }, [
    category,
    favoriteIdsKey,
    hasData,
    loading,
    loadingMore,
    normalizedSearch,
    result.isError,
    shouldFetchAssets,
  ]);

  return {
    assets,
    loading,
    loadingMore,
    isError: shouldFetchAssets && result.isError,
    emptyState: isFavoritesCategory && !hasFavoriteIds ? "favorites" : undefined,
    onEndReached,
  };
}

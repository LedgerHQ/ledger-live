import { useCallback, useEffect, useMemo, useState } from "react";
import { useMarketData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { KeysPriceChange, Order } from "@ledgerhq/live-common/market/utils/types";
import { useLocale, useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector } from "~/reducers/settings";
import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";
import { mapMarketCurrencyToDisplayData } from "../../utils/marketAssetDisplay";

const DEFAULT_RANGE = KeysPriceChange.day;
const PAGE_SIZE = 20;

export type MarketAssetsParams = {
  search?: string;
};

type PaginationState = {
  page: number;
  search: string;
};

export interface MarketAssetsResult {
  assets: MarketAssetDisplayData[];
  loading: boolean;
  loadingMore: boolean;
  isError: boolean;
  onEndReached: () => void;
}

export function useMarketAssets({ search = "" }: MarketAssetsParams = {}): MarketAssetsResult {
  const { locale } = useLocale();
  const { t } = useTranslation();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const counterCurrency = counterValueCurrency.ticker.toLowerCase();
  const counterValueUnit = counterValueCurrency.units[0];
  const normalizedSearch = search.trim();
  const [pagination, setPagination] = useState<PaginationState>(() => ({
    page: 1,
    search: normalizedSearch,
  }));
  const isPaginationSearchSynced = pagination.search === normalizedSearch;
  const page = isPaginationSearchSynced ? pagination.page : 1;

  useEffect(() => {
    if (!isPaginationSearchSynced) {
      setPagination({ page: 1, search: normalizedSearch });
    }
  }, [isPaginationSearchSynced, normalizedSearch]);

  const result = useMarketData({
    counterCurrency,
    range: DEFAULT_RANGE,
    order: Order.MarketCapDesc,
    limit: PAGE_SIZE,
    liveCompatible: true,
    page,
    search: normalizedSearch,
  });

  const assets = useMemo(() => {
    const uniqueById = [...new Map(result.data.map(item => [item.id, item])).values()];
    return uniqueById.map(item =>
      mapMarketCurrencyToDisplayData(item, {
        counterCurrency,
        counterValueUnit,
        range: DEFAULT_RANGE,
        locale,
        t,
      }),
    );
  }, [result.data, counterCurrency, counterValueUnit, locale, t]);

  const hasData = assets.length > 0;
  const loading = (result.isLoading || result.isPending) && !hasData;
  const loadingMore = result.isFetching && hasData;

  const onEndReached = useCallback(() => {
    if (!hasData || loading || loadingMore || result.isError) return;

    setPagination(current => {
      if (current.search !== normalizedSearch) {
        return { page: 1, search: normalizedSearch };
      }

      return { ...current, page: current.page + 1 };
    });
  }, [hasData, loading, loadingMore, normalizedSearch, result.isError]);

  return {
    assets,
    loading,
    loadingMore,
    isError: result.isError,
    onEndReached,
  };
}

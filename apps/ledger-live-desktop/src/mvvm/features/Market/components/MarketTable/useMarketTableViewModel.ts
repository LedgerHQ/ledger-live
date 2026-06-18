import { useCallback, useMemo } from "react";
import { TFunction } from "i18next";
import {
  MarketCurrencyData,
  MarketListRequestParams,
  Order,
} from "@ledgerhq/live-common/market/utils/types";
import { useMarketListVirtualization } from "../../hooks/useMarketListVirtualization";
import {
  getMarketSortDirection,
  getMarketSortListAnalytics,
} from "../../utils/marketPageAnalytics";
import { track } from "~/renderer/analytics/segment";

export type MarketTableData = {
  marketData: MarketCurrencyData[];
  marketParams: MarketListRequestParams;
  locale: string;
  freshLoading: boolean;
  isError: boolean;
  loading: boolean;
  currenciesLength: number;
  itemCount: number;
  listKey: string;
  emptyState?: "favorites";
  starredMarketCoins: string[];
  resetSearch: () => void;
  refresh: (payload: MarketListRequestParams) => void;
  toggleStar: (id: string, isStarred: boolean) => void;
  onLoadNextPage: () => void;
  checkIfDataIsStaleAndRefetch: (scrollOffset: number) => void;
  t: TFunction;
};

export function useMarketTableViewModel({
  marketData,
  marketParams,
  locale,
  freshLoading,
  isError,
  loading,
  currenciesLength,
  itemCount,
  listKey,
  emptyState,
  starredMarketCoins,
  resetSearch,
  refresh,
  toggleStar,
  onLoadNextPage,
  checkIfDataIsStaleAndRefetch,
  t,
}: MarketTableData) {
  const { order, counterCurrency, range, search } = marketParams;

  const { parentRef, rowVirtualizer } = useMarketListVirtualization({
    itemCount,
    marketData,
    loading,
    currenciesLength,
    listKey,
    onLoadNextPage,
    checkIfDataIsStaleAndRefetch,
  });

  const starredSet = useMemo(() => new Set(starredMarketCoins), [starredMarketCoins]);
  const isStarred = useCallback((id: string) => starredSet.has(id), [starredSet]);

  const onSort = useCallback(
    (nextOrder: Order) => {
      refresh({ order: nextOrder });
      track("sort_market_list", getMarketSortListAnalytics({ order: nextOrder, range }));
    },
    [refresh, range],
  );
  const onToggleMarketCap = useCallback(
    () => onSort(order === Order.MarketCapDesc ? Order.MarketCapAsc : Order.MarketCapDesc),
    [onSort, order],
  );
  const onToggleChange = useCallback(
    () => onSort(order === Order.topGainers ? Order.topLosers : Order.topGainers),
    [onSort, order],
  );
  const onToggleVolume = useCallback(
    () => onSort(order === Order.VolumeDesc ? Order.VolumeAsc : Order.VolumeDesc),
    [onSort, order],
  );

  const marketCapSort = getMarketSortDirection(order, Order.MarketCapDesc, Order.MarketCapAsc);
  const changeSort = getMarketSortDirection(order, Order.topGainers, Order.topLosers);
  const volumeSort = getMarketSortDirection(order, Order.VolumeDesc, Order.VolumeAsc);

  return {
    parentRef,
    rowVirtualizer,
    marketData,
    marketParams,
    counterCurrency,
    range,
    search,
    locale,
    currenciesLength,
    showSkeleton: freshLoading || isError,
    emptyState,
    resetSearch,
    isStarred,
    toggleStar,
    marketCapSort,
    changeSort,
    volumeSort,
    onToggleMarketCap,
    onToggleChange,
    onToggleVolume,
    t,
  };
}

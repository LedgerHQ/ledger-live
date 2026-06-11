import { useCallback, useMemo } from "react";
import { TFunction } from "i18next";
import {
  MarketCurrencyData,
  MarketListRequestParams,
  Order,
} from "@ledgerhq/live-common/market/utils/types";
import { useMarketListVirtualization } from "../../hooks/useMarketListVirtualization";

export type MarketTableData = {
  marketData: MarketCurrencyData[];
  marketParams: MarketListRequestParams;
  locale: string;
  freshLoading: boolean;
  isError: boolean;
  loading: boolean;
  currenciesLength: number;
  itemCount: number;
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
    onLoadNextPage,
    checkIfDataIsStaleAndRefetch,
  });

  const starredSet = useMemo(() => new Set(starredMarketCoins), [starredMarketCoins]);
  const isStarred = useCallback((id: string) => starredSet.has(id), [starredSet]);

  const onSort = useCallback((nextOrder: Order) => refresh({ order: nextOrder }), [refresh]);
  const onToggleMarketCap = useCallback(
    () => onSort(order === Order.MarketCapDesc ? Order.MarketCapAsc : Order.MarketCapDesc),
    [onSort, order],
  );
  const onToggleChange = useCallback(
    () => onSort(order === Order.topGainers ? Order.topLosers : Order.topGainers),
    [onSort, order],
  );

  const marketCapSort: "asc" | "desc" | undefined =
    order === Order.MarketCapDesc ? "desc" : order === Order.MarketCapAsc ? "asc" : undefined;
  const changeSort: "asc" | "desc" | undefined =
    order === Order.topGainers ? "desc" : order === Order.topLosers ? "asc" : undefined;

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
    onToggleMarketCap,
    onToggleChange,
    t,
  };
}

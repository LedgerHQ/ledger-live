import { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { marketApi, useGetMarketListInfiniteQuery } from "../state-manager/api";
import { toMarketListQueryArg } from "../utils/marketListQueryArg";
import type { MarketListRequestParams, MarketListRequestResult } from "../utils/types";
import type { MarketListQueryArg } from "../state-manager/types";

type MarketApiState = { [marketApi.reducerPath]: ReturnType<typeof marketApi.reducer> };
type MarketThunkDispatch = ThunkDispatch<MarketApiState, unknown, UnknownAction>;

function useMarketListQueryArg({
  counterCurrency,
  limit,
  order,
  range,
  search,
  filter,
  starred,
  liveCompatible,
  categories,
}: MarketListRequestParams): MarketListQueryArg {
  const starredKey = starred?.join(",") ?? "";

  return useMemo(
    () =>
      toMarketListQueryArg({
        counterCurrency,
        limit,
        order,
        range,
        search,
        filter,
        starred: starredKey ? starredKey.split(",") : [],
        liveCompatible,
        categories,
      }),
    [counterCurrency, limit, order, range, search, filter, starredKey, liveCompatible, categories],
  );
}

export function useMarketData(
  props: MarketListRequestParams,
  options?: { enabled?: boolean; refreshRate?: number },
): MarketListRequestResult {
  const dispatch = useDispatch<MarketThunkDispatch>();
  const enabled = options?.enabled ?? true;
  const queryArg = useMarketListQueryArg(props);
  const query = useGetMarketListInfiniteQuery(queryArg, {
    skip: !enabled,
    pollingInterval: options?.refreshRate ?? 0,
    refetchOnReconnect: true,
  });
  const pages = query.currentData?.pages;
  const isLoading = query.isLoading || (query.isFetching && !query.currentData);

  const resetToFirstPage = useCallback(() => {
    dispatch(
      marketApi.util.updateQueryData("getMarketList", queryArg, draft => {
        draft.pages.splice(1);
        draft.pageParams.splice(1);
      }),
    );
  }, [dispatch, queryArg]);

  const {
    hasNextPage,
    isFetching,
    fetchNextPage: fetchNextQueryPage,
    refetch: refetchQuery,
  } = query;

  const fetchNextPage = useCallback(() => {
    if (hasNextPage && !isFetching) fetchNextQueryPage();
  }, [fetchNextQueryPage, hasNextPage, isFetching]);

  const refetch = useCallback(() => {
    refetchQuery();
  }, [refetchQuery]);

  const data = useMemo(() => pages?.flat() ?? [], [pages]);

  return {
    data,
    isPending: query.isUninitialized || isLoading,
    isLoading,
    isError: query.isError,
    isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    resetToFirstPage,
  };
}

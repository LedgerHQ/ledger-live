import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type {
  MarketListCategory,
  MarketListFilterTimeframe,
  MarketListSorting,
} from "~/reducers/types";

type PaginationState = {
  page: number;
  search: string;
  category: MarketListCategory;
  favoriteIdsKey: string;
  sorting: MarketListSorting;
  timeframe: MarketListFilterTimeframe;
};

export type PaginationParams = Omit<PaginationState, "page">;

export function useMarketAssetPagination({
  params,
  shouldFetchAssets,
}: {
  params: PaginationParams;
  shouldFetchAssets: boolean;
}): {
  page: number;
  requestedPage: number;
  setPagination: Dispatch<SetStateAction<PaginationState>>;
} {
  const [pagination, setPagination] = useState<PaginationState>(() =>
    createPaginationState(params),
  );
  const isPaginationSynced = isSamePaginationTarget(pagination, params);
  const page = isPaginationSynced ? pagination.page : 1;
  const requestedPage = shouldFetchAssets ? page : 0;

  useEffect(() => {
    if (!isPaginationSynced) {
      setPagination(createPaginationState(params));
    }
  }, [isPaginationSynced, params]);

  return { page, requestedPage, setPagination };
}

export function getNextPaginationState(
  current: PaginationState,
  params: PaginationParams,
): PaginationState {
  if (!isSamePaginationTarget(current, params)) {
    return createPaginationState(params);
  }

  return { ...current, page: current.page + 1 };
}

function createPaginationState(params: PaginationParams): PaginationState {
  return {
    page: 1,
    ...params,
  };
}

function isSamePaginationTarget(state: PaginationState, params: PaginationParams): boolean {
  return (
    state.search === params.search &&
    state.category === params.category &&
    state.favoriteIdsKey === params.favoriteIdsKey &&
    state.sorting === params.sorting &&
    state.timeframe === params.timeframe
  );
}

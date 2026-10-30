import { useMemo } from "react";
import {
  useGetAssetsDataInfiniteQuery,
  GetAssetsDataParams,
  parseError,
  mergeAssetsDataPages,
} from "@domain/api-aggregated-assets";

export function useAssetsData({
  search,
  currencyIds,
  networkIds,
  categories,
  useCase,
  areCurrenciesFiltered,
  product,
  version,
  isStaging,
  includeTestNetworks,
  skip,
  pollingInterval,
  skipPollingIfUnfocused,
}: GetAssetsDataParams & {
  areCurrenciesFiltered?: boolean;
  skip?: boolean;
  pollingInterval?: number;
  skipPollingIfUnfocused?: boolean;
}) {
  const {
    data,
    currentData,
    isLoading,
    error,
    fetchNextPage,
    isSuccess,
    refetch,
    isFetching,
    isError,
    isFetchingNextPage,
  } = useGetAssetsDataInfiniteQuery(
    {
      search,
      useCase,
      currencyIds: areCurrenciesFiltered ? currencyIds : undefined,
      networkIds: networkIds?.length ? networkIds : undefined,
      categories,
      product,
      version,
      isStaging,
      includeTestNetworks,
    },
    { skip, pollingInterval, skipPollingIfUnfocused },
  );

  const joinedPages = useMemo(() => mergeAssetsDataPages(data?.pages), [data]);

  const hasMore = Boolean(joinedPages?.pagination.nextCursor);

  const isInitialLoading = isLoading || (isFetching && !isFetchingNextPage);

  const errorInfo = useMemo(() => parseError(error), [error]);

  return {
    data: joinedPages,
    /** True when `data` was fetched for previous query arguments and kept while the current ones load. */
    isStale: data !== undefined && currentData === undefined,
    isLoading: isInitialLoading,
    isFetchingNextPage,
    error,
    errorInfo,
    loadNext: hasMore ? fetchNextPage : undefined,
    isSuccess,
    isError,
    refetch,
  };
}

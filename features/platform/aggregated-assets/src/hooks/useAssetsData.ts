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

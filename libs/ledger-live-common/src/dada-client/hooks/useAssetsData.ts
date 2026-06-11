import { useMemo } from "react";
import { useGetAssetsDataInfiniteQuery } from "../state-manager/api";
import { GetAssetsDataParams } from "../state-manager/types";
import { parseError } from "../utils/errorUtils";
import { mergeAssetsDataPages } from "../utils/mergeAssetsDataPages";

export function useAssetsData({
  search,
  currencyIds,
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

import { useMemo } from "react";
import { useGetTokensDataInfiniteQuery } from "../state-manager/api";
import { TokensDataWithPagination, GetTokensDataParams } from "../state-manager/types";

const emptyData = () => ({
  tokens: [],
  pagination: { nextCursor: "" },
});

export function useTokensData(params: GetTokensDataParams) {
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
  } = useGetTokensDataInfiniteQuery(params);

  const joinedPages = useMemo(() => {
    return data?.pages.reduce<TokensDataWithPagination>((acc, page) => {
      return {
        tokens: [...acc.tokens, ...page.tokens],
        pagination: {
          nextCursor: page.pagination.nextCursor,
        },
      };
    }, emptyData());
  }, [data]);

  const hasMore = Boolean(joinedPages?.pagination.nextCursor);

  const isInitialLoading = isLoading || (isFetching && !isFetchingNextPage);

  return {
    data: joinedPages,
    isLoading: isInitialLoading,
    error,
    loadNext: hasMore ? fetchNextPage : undefined,
    isSuccess,
    isError,
    refetch,
  };
}

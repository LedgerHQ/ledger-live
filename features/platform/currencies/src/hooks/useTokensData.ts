import { useMemo } from "react";
import {
  useGetTokensDataInfiniteQuery,
  type GetTokensDataParams,
  type TokensDataWithPagination,
} from "@domain/api-currency-token";

const emptyData = (): TokensDataWithPagination => ({
  tokens: [],
  pagination: { nextCursor: "" },
});

/**
 * Paginated CAL token list. Joins the RTK-Query infinite-query pages into a single
 * `{ tokens, pagination }` and exposes a `loadNext` when more pages are available.
 *
 * Relocated from `@ledgerhq/cryptoassets/cal-client/hooks` onto `@domain/api-currency-token`.
 */
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

  const joinedPages = useMemo(
    () =>
      data?.pages.reduce<TokensDataWithPagination>(
        (acc, page) => ({
          tokens: [...acc.tokens, ...page.tokens],
          pagination: { nextCursor: page.pagination.nextCursor },
        }),
        emptyData(),
      ),
    [data],
  );

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

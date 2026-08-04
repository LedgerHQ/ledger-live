import { useMemo } from "react";
import {
  useGetTokensDataInfiniteQuery,
  type GetTokensDataParams,
  type TokensDataWithPagination,
} from "@domain/api-currency-token";

/**
 * Paginated CAL token list. Joins the RTK-Query infinite-query pages into a single
 * `{ tokens, pagination }` and exposes a `loadNext` when more pages are available.
 *
 * Wraps the `@domain/api-currency-token` infinite query (this hook lives in
 * `@features/platform-currencies`).
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

  const joinedPages = useMemo<TokensDataWithPagination | undefined>(() => {
    if (!data) return undefined;
    return {
      // Single O(n) pass — avoid re-spreading the accumulator on every page.
      tokens: data.pages.flatMap(page => page.tokens),
      pagination: { nextCursor: data.pages.at(-1)?.pagination.nextCursor },
    };
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

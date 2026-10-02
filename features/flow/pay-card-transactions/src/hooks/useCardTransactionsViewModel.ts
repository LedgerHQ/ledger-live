import { useCallback, useMemo } from "react";
import {
  joinCardTransactionsPages,
  useGetCardTransactionsInfiniteQuery,
} from "@domain/api-card-management";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth/hooks";
import { useTranslation } from "@shared/i18n";
import type { CardTransactionItem, CardTransactionsViewModel } from "../types";

export function useCardTransactionsViewModel(): CardTransactionsViewModel {
  const { t } = useTranslation();
  const isSignedIn = useIsCardSignedIn();
  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetCardTransactionsInfiniteQuery(undefined, { skip: !isSignedIn });

  const transactions = useMemo<readonly CardTransactionItem[]>(
    () =>
      joinCardTransactionsPages(data?.pages).map(transaction => ({
        transaction,
        categoryLabel: t(`payTab.cardTransactions.categories.${transaction.mccCategory}`),
      })),
    [data, t],
  );

  const refetchWhenSignedIn = useCallback(() => {
    if (!isSignedIn) {
      return;
    }

    refetch();
  }, [isSignedIn, refetch]);

  const loadMore = useCallback(() => {
    if (!isSignedIn || !hasNextPage || isFetchingNextPage) {
      return;
    }

    fetchNextPage();
  }, [isSignedIn, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Not offered once a read has failed. A scroll-driven caller re-arms whenever `loadMore` changes
  // identity, and a failed page changes it just as a successful one does — so leaving it offered
  // turns one failure into a request loop with nothing on screen to stop it.
  const canLoadMore = isSignedIn && hasNextPage && !isError;

  return useMemo(
    () => ({
      transactions,
      isLoading,
      isFetching,
      isError,
      isLoadingMore: isFetchingNextPage,
      refetch: refetchWhenSignedIn,
      loadMore: canLoadMore ? loadMore : undefined,
    }),
    [
      transactions,
      isLoading,
      isFetching,
      isError,
      isFetchingNextPage,
      refetchWhenSignedIn,
      canLoadMore,
      loadMore,
    ],
  );
}

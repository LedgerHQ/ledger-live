import { useCallback, useMemo } from "react";
import { useGetCardTransactionsQuery } from "@domain/api-card-management";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth/hooks";
import { useTranslation } from "@shared/i18n";
import { categoryOf } from "../logic/categoryOf";
import type { CardTransactionItem, CardTransactionsViewModel } from "../types";

const NO_TRANSACTIONS: readonly [] = [];

export function useCardTransactionsViewModel(): CardTransactionsViewModel {
  const { t } = useTranslation();
  const isSignedIn = useIsCardSignedIn();
  const { data, isLoading, isFetching, isError, refetch } = useGetCardTransactionsQuery(undefined, {
    skip: !isSignedIn,
  });

  const transactions = useMemo<readonly CardTransactionItem[]>(
    () =>
      (data ?? NO_TRANSACTIONS).map(transaction => {
        const category = categoryOf(transaction);

        return {
          transaction,
          category,
          categoryLabel: t(`payTab.cardTransactions.categories.${category}`),
        };
      }),
    [data, t],
  );

  const refetchWhenSignedIn = useCallback(() => {
    if (!isSignedIn) {
      return;
    }

    refetch();
  }, [isSignedIn, refetch]);

  return useMemo(
    () => ({
      transactions,
      isLoading,
      isFetching,
      isError,
      refetch: refetchWhenSignedIn,
    }),
    [transactions, isLoading, isFetching, isError, refetchWhenSignedIn],
  );
}

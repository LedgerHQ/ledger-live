import { useCallback, useMemo } from "react";
import { useGetCardTransactionsQuery } from "@domain/api-card-management";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth/hooks";
import { useTranslation } from "@shared/i18n";
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
        return {
          transaction,
          categoryLabel: t(`payTab.cardTransactions.categories.${transaction.mccCategory}`),
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

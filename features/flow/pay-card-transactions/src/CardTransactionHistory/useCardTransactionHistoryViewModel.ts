import { useMemo } from "react";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth/hooks";
import { useCardTransactionsViewModel } from "../hooks/useCardTransactionsViewModel";
import { groupCardHistoryItems } from "./groupCardHistoryItems";
import { resolveCardTransactionHistoryUiState } from "./cardTransactionHistoryUiState";
import type { CardTransactionHistoryProps, CardTransactionHistoryViewProps } from "./types";

export function useCardTransactionHistoryViewModel({
  formatters,
  filterTransaction,
  onRowClick,
  formatDay,
  onGoToPay,
  cardVisual,
}: CardTransactionHistoryProps &
  Pick<CardTransactionHistoryViewProps, "onRowClick">): CardTransactionHistoryViewProps {
  const isSignedIn = useIsCardSignedIn();
  const { transactions, isLoading, isError } = useCardTransactionsViewModel();
  const filteredTransactions = useMemo(
    () => (filterTransaction ? transactions.filter(filterTransaction) : transactions),
    [filterTransaction, transactions],
  );
  const groups = useMemo(() => groupCardHistoryItems(filteredTransactions), [filteredTransactions]);
  const displayState = useMemo(
    () =>
      resolveCardTransactionHistoryUiState({
        isSignedIn,
        isLoading,
        isError,
        groups,
      }),
    [groups, isError, isLoading, isSignedIn],
  );

  return {
    displayState,
    formatters,
    formatDay,
    onRowClick,
    onGoToPay,
    cardVisual,
  };
}

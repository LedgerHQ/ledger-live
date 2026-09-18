import { useCallback, useMemo } from "react";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth/hooks";
import { useCardTransactionsViewModel } from "../hooks/useCardTransactionsViewModel";
import { isCardTransactionFundedBy } from "../logic/isCardTransactionFundedBy";
import { groupCardHistoryItems } from "./groupCardHistoryItems";
import { resolveCardTransactionHistoryUiState } from "./cardTransactionHistoryUiState";
import type { CardTransactionHistoryProps, CardTransactionHistoryViewProps } from "./types";

export function useCardTransactionHistoryViewModel({
  asset,
  formatters,
  onRowClick,
  formatDay,
  onGoToPay,
  onTrackEvent,
  cardVisual,
}: CardTransactionHistoryProps &
  Pick<CardTransactionHistoryViewProps, "onRowClick">): CardTransactionHistoryViewProps {
  const isSignedIn = useIsCardSignedIn();
  const { transactions, isLoading, isError, loadMore, isLoadingMore } =
    useCardTransactionsViewModel();
  const scopedTransactions = useMemo(
    () =>
      asset ? transactions.filter(item => isCardTransactionFundedBy(item, asset)) : transactions,
    [asset, transactions],
  );
  const groups = useMemo(() => groupCardHistoryItems(scopedTransactions), [scopedTransactions]);
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
  const handleGoToPay = useCallback(() => {
    onTrackEvent?.("button_clicked", { button: "card banner", page: "History" });
    onGoToPay?.();
  }, [onGoToPay, onTrackEvent]);

  return {
    displayState,
    formatters,
    formatDay,
    onRowClick,
    onGoToPay: onGoToPay ? handleGoToPay : undefined,
    cardVisual,
    onLoadMore: loadMore,
    isLoadingMore,
  };
}

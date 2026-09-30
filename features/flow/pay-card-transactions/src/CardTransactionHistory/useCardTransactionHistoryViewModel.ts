import { useCallback, useMemo } from "react";
import { useGetCardStatusQuery } from "@domain/api-card-management";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth/hooks";
import { trackButtonClicked } from "@features/platform-pay-analytics";
import { useCardTransactionsViewModel } from "../hooks/useCardTransactionsViewModel";
import { isCardTransactionFundedBy } from "../logic/isCardTransactionFundedBy";
import { groupCardHistoryItems } from "./groupCardHistoryItems";
import { resolveCardTransactionHistoryUiState } from "./cardTransactionHistoryUiState";
import type { CardTransactionHistoryProps, CardTransactionHistoryViewProps } from "./types";

function isCardNotFoundError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "status" in error && error.status === 404;
}

export function useCardTransactionHistoryViewModel({
  asset,
  formatters,
  onRowClick,
  formatDay,
  onGoToPay,
  cardVisual,
}: CardTransactionHistoryProps &
  Pick<CardTransactionHistoryViewProps, "onRowClick">): CardTransactionHistoryViewProps {
  const isSignedIn = useIsCardSignedIn();
  const cardStatus = useGetCardStatusQuery(undefined, { skip: !isSignedIn });
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
        isCardMissing:
          isSignedIn && cardStatus.data === undefined && isCardNotFoundError(cardStatus.error),
        isCardStatusLoading: isSignedIn && cardStatus.isLoading,
        isLoading,
        isError,
        groups,
      }),
    [
      cardStatus.data,
      cardStatus.error,
      cardStatus.isLoading,
      groups,
      isError,
      isLoading,
      isSignedIn,
    ],
  );
  const handleGoToPay = useCallback(() => {
    trackButtonClicked({ button: "card banner", page: "History" });
    onGoToPay?.();
  }, [onGoToPay]);

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

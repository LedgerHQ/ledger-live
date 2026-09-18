import { useMemo } from "react";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth/hooks";
import { isCardTransactionFundedBy } from "../logic/isCardTransactionFundedBy";
import { useCardTransactionsViewModel } from "../hooks/useCardTransactionsViewModel";
import { groupCardHistoryItems } from "./groupCardHistoryItems";
import { resolveCardTransactionHistoryUiState } from "./cardTransactionHistoryUiState";
import type { CardTransactionHistoryProps, CardTransactionHistoryViewProps } from "./types";

export function useCardTransactionHistoryViewModel({
  formatters,
  asset,
  onRowClick,
  formatDay,
  onGoToPay,
  cardVisual,
}: CardTransactionHistoryProps &
  Pick<CardTransactionHistoryViewProps, "onRowClick">): CardTransactionHistoryViewProps {
  const isSignedIn = useIsCardSignedIn();
  const { transactions, isLoading, isError } = useCardTransactionsViewModel();
  // `asset` carries the linked wallet's provider pair, e.g. `usdc.ethereum`. A pair the catalog
  // cannot resolve matches no funding source, so the list filters down to nothing.
  const filteredTransactions = useMemo(() => {
    if (!asset) return transactions;
    const [assetCode = "", network] = asset.split(".");
    return transactions.filter(item => isCardTransactionFundedBy(item, assetCode, network));
  }, [asset, transactions]);
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

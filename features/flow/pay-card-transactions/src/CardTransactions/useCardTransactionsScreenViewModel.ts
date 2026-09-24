import { useTranslation } from "@shared/i18n";
import { useCardTransactionsViewModel } from "../hooks/useCardTransactionsViewModel";
import { resolveCardTransactionsDisplayState } from "../logic/cardTransactionsDisplayState";
import type { CardTransactionsProps, CardTransactionsScreenViewProps } from "./types";

export function useCardTransactionsScreenViewModel(
  props: CardTransactionsProps = {},
): CardTransactionsScreenViewProps {
  const { t } = useTranslation();
  const { transactions, isLoading, isError } = useCardTransactionsViewModel();
  const title = t("payTab.cardTransactions.title");
  const displayState = resolveCardTransactionsDisplayState({
    isLoading,
    isError,
    hasTransactions: transactions.length > 0,
  });

  return {
    ...props,
    displayState,
    title,
    transactions,
  };
}

import { useTranslation } from "@shared/i18n";
import { useCardTransactionsViewModel } from "../hooks/useCardTransactionsViewModel";
import type { CardTransactionsProps, CardTransactionsScreenViewProps } from "./types";

export function useCardTransactionsScreenViewModel(
  props: CardTransactionsProps = {},
): CardTransactionsScreenViewProps {
  const { t } = useTranslation();
  const { transactions, isLoading, isError } = useCardTransactionsViewModel();
  const title = t("payTab.cardTransactions.title");

  if (isLoading) {
    return { ...props, displayMode: "loading", title, transactions };
  }

  if (isError) {
    return { ...props, displayMode: "error", title, transactions };
  }

  return {
    ...props,
    displayMode: transactions.length === 0 ? "empty" : "list",
    title,
    transactions,
  };
}

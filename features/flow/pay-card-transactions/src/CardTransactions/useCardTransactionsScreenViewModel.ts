import { useTranslation } from "@shared/i18n";
import { useCardTransactionsViewModel } from "../hooks/useCardTransactionsViewModel";
import type { CardTransactionsProps, CardTransactionsScreenViewProps } from "./types";

export function useCardTransactionsScreenViewModel({
  formatAmount,
}: CardTransactionsProps = {}): CardTransactionsScreenViewProps {
  const { t } = useTranslation();
  const { transactions, isLoading, isError } = useCardTransactionsViewModel();
  const title = t("payTab.cardTransactions.title");

  if (isLoading) {
    return { displayMode: "loading", title, transactions, formatAmount };
  }

  if (isError) {
    return { displayMode: "error", title, transactions, formatAmount };
  }

  return {
    displayMode: transactions.length === 0 ? "empty" : "list",
    title,
    transactions,
    formatAmount,
  };
}

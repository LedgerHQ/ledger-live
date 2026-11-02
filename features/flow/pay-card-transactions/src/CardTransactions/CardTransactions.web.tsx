import React from "react";
import { CardTransactionDetailDialog } from "./components/Detail/CardTransactionDetailDialog";
import { CardTransactionsView } from "./CardTransactionsView";
import { useCardTransactionDetailDialog } from "./useCardTransactionDetailDialog";
import { useCardTransactionsScreenViewModel } from "./useCardTransactionsScreenViewModel";
import type { CardTransactionsProps } from "./CardTransactions.types";

export function CardTransactions(props: CardTransactionsProps) {
  const detail = useCardTransactionDetailDialog(props);
  const viewModel = useCardTransactionsScreenViewModel({
    ...props,
    onOpenTransaction: detail.onOpenTransaction,
  });

  return (
    <>
      <CardTransactionsView {...viewModel} />
      {detail.selectedTransaction ? (
        <CardTransactionDetailDialog
          isOpen
          transaction={detail.selectedTransaction}
          formatters={props.formatters}
          onClose={detail.onClose}
        />
      ) : null}
    </>
  );
}

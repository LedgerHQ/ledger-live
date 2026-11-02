import React from "react";
import { CardTransactionDetailDialog } from "../CardTransactions/components/Detail/CardTransactionDetailDialog";
import { useCardTransactionDetailDialog } from "../CardTransactions/useCardTransactionDetailDialog";
import { CardTransactionHistoryView } from "./CardTransactionHistoryView";
import { useCardTransactionHistoryViewModel } from "./useCardTransactionHistoryViewModel";
import type { CardTransactionHistoryProps } from "./types";

export function CardTransactionHistory(props: CardTransactionHistoryProps) {
  const detail = useCardTransactionDetailDialog({ page: "History" });
  const viewModel = useCardTransactionHistoryViewModel({
    ...props,
    onRowClick: detail.onOpenTransaction,
  });

  return (
    <>
      <CardTransactionHistoryView {...viewModel} />
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

import React from "react";
import { CardTransactionDetail } from "../CardTransactions/components/Detail";
import { useTrackedCardTransactionDetailDialog } from "../CardTransactions/useCardTransactionDetailDialog";
import { CardTransactionHistoryView } from "./CardTransactionHistoryView";
import { useCardTransactionHistoryViewModel } from "./useCardTransactionHistoryViewModel";
import type { CardTransactionHistoryProps } from "./types";

export function CardTransactionHistory(props: CardTransactionHistoryProps) {
  const detail = useTrackedCardTransactionDetailDialog({
    onTrackEvent: props.onTrackEvent,
    page: "History",
  });
  const viewModel = useCardTransactionHistoryViewModel({
    ...props,
    onRowClick: detail.onTransactionPress,
  });

  return (
    <>
      <CardTransactionHistoryView {...viewModel} />
      {detail.selectedTransaction ? (
        <CardTransactionDetail
          isOpen
          transaction={detail.selectedTransaction}
          formatters={props.formatters}
          onClose={detail.onClose}
        />
      ) : null}
    </>
  );
}

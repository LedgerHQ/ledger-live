import React from "react";
import { CardTransactionDetail } from "./components/Detail";
import { CardTransactionsView } from "./CardTransactionsView";
import { useCardTransactionDetailDialog } from "./useCardTransactionDetailDialog";
import { useCardTransactionsScreenViewModel } from "./useCardTransactionsScreenViewModel";
import type { CardTransactionsProps } from "./types";

export function CardTransactions(props: CardTransactionsProps) {
  const detail = useCardTransactionDetailDialog(props);
  const viewModel = useCardTransactionsScreenViewModel({
    ...props,
    onTransactionPress: detail.onTransactionPress,
  });

  return (
    <>
      <CardTransactionsView {...viewModel} />
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

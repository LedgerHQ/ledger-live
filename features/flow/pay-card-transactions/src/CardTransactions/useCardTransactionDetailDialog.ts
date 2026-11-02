import { useCallback, useState } from "react";
import type { PayCardTransaction } from "@domain/api-card-management";
import { trackTransactionClicked } from "@features/platform-pay-analytics";
import {
  transactionClickedProperties,
  type CardTransactionClickedPage,
} from "../logic/transactionClickedProperties";
import type { CardTransactionItem } from "../types";
import type { CardTransactionsProps } from "./CardTransactions.types";

type CardTransactionDetailDialogViewModel = Readonly<{
  selectedTransaction: PayCardTransaction | undefined;
  onOpenTransaction: (item: CardTransactionItem) => void;
  onClose: () => void;
}>;

export function useCardTransactionDetailDialog({
  onOpenTransaction,
  page = "Pay",
}: Pick<CardTransactionsProps, "onOpenTransaction"> & {
  page?: CardTransactionClickedPage;
}): CardTransactionDetailDialogViewModel {
  const [selectedTransaction, setSelectedTransaction] = useState<PayCardTransaction>();

  const openTransaction = useCallback(
    (item: CardTransactionItem) => {
      onOpenTransaction?.(item);
      trackTransactionClicked(transactionClickedProperties(item.transaction, page));
      setSelectedTransaction(item.transaction);
    },
    [onOpenTransaction, page],
  );

  const closeTransaction = useCallback(() => {
    setSelectedTransaction(undefined);
  }, []);

  return {
    selectedTransaction,
    onOpenTransaction: openTransaction,
    onClose: closeTransaction,
  };
}

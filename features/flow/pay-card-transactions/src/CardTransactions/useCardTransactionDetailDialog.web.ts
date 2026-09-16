import { useCallback, useState } from "react";
import type { PayCardTransaction } from "@domain/api-card-management";
import {
  transactionClickedProperties,
  type CardTransactionClickedPage,
} from "../logic/transactionClickedProperties";
import type { CardTransactionItem } from "../types";
import type { CardTransactionsProps } from "./types";

type CardTransactionDetailDialogViewModel = Readonly<{
  selectedTransaction: PayCardTransaction | undefined;
  onTransactionPress: (item: CardTransactionItem) => void;
  onClose: () => void;
}>;

export function useCardTransactionDetailDialog({
  onTransactionPress,
  onTrackEvent,
  page = "Pay",
}: Pick<CardTransactionsProps, "onTransactionPress" | "onTrackEvent"> & {
  page?: CardTransactionClickedPage;
}): CardTransactionDetailDialogViewModel {
  const [selectedTransaction, setSelectedTransaction] = useState<PayCardTransaction>();

  const openTransaction = useCallback(
    (item: CardTransactionItem) => {
      onTransactionPress?.(item);
      onTrackEvent?.("transaction_clicked", transactionClickedProperties(item.transaction, page));
      setSelectedTransaction(item.transaction);
    },
    [onTransactionPress, onTrackEvent, page],
  );

  const closeTransaction = useCallback(() => {
    setSelectedTransaction(undefined);
  }, []);

  return {
    selectedTransaction,
    onTransactionPress: openTransaction,
    onClose: closeTransaction,
  };
}

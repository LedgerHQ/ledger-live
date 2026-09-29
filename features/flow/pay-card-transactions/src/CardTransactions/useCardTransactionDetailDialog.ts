import { useCallback, useState } from "react";
import type { PayCardTransaction } from "@domain/api-card-management";
import { trackTransactionClicked } from "@features/platform-pay-analytics";
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
  page = "Pay",
}: Pick<CardTransactionsProps, "onTransactionPress"> & {
  page?: CardTransactionClickedPage;
}): CardTransactionDetailDialogViewModel {
  const [selectedTransaction, setSelectedTransaction] = useState<PayCardTransaction>();

  const openTransaction = useCallback(
    (item: CardTransactionItem) => {
      onTransactionPress?.(item);
      trackTransactionClicked(transactionClickedProperties(item.transaction, page));
      setSelectedTransaction(item.transaction);
    },
    [onTransactionPress, page],
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

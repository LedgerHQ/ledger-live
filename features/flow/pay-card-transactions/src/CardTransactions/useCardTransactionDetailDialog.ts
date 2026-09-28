import { useCallback, useState } from "react";
import type { PayCardTransaction } from "@domain/api-card-management";
import { usePayAnalyticsContext } from "@features/platform-pay-analytics";
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
  const { trackEvent } = usePayAnalyticsContext();

  return useTrackedCardTransactionDetailDialog({
    onTransactionPress,
    onTrackEvent: trackEvent,
    page,
  });
}

export function useTrackedCardTransactionDetailDialog({
  onTransactionPress,
  onTrackEvent,
  page,
}: Pick<CardTransactionsProps, "onTransactionPress"> & {
  onTrackEvent?: (event: string, params: Record<string, unknown>) => void;
  page: CardTransactionClickedPage;
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

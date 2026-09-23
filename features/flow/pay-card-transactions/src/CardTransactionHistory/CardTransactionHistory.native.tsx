import React from "react";
import { BottomSheetHeader, BottomSheetScrollView, Box } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
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
      <QueuedBottomSheet
        isRequestingToBeOpened={!!detail.selectedTransaction}
        onClose={detail.onClose}
        enableDynamicSizing
        maxDynamicContentSize="fullWithOffset"
        testID="card-transaction-detail-sheet"
      >
        {detail.selectedTransaction ? (
          <CardTransactionDetailSheetContent>
            <BottomSheetHeader density="compact" spacing />
            <CardTransactionDetail
              transaction={detail.selectedTransaction}
              formatters={props.formatters}
            />
          </CardTransactionDetailSheetContent>
        ) : null}
      </QueuedBottomSheet>
    </>
  );
}

function CardTransactionDetailSheetContent({ children }: Readonly<{ children: React.ReactNode }>) {
  const bottomInset = useBottomSheetBottomInset();

  return (
    <BottomSheetScrollView>
      <Box style={{ paddingBottom: bottomInset + 24 }}>{children}</Box>
    </BottomSheetScrollView>
  );
}

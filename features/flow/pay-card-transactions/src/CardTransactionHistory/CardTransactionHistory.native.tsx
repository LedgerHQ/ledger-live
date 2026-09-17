import React from "react";
import { BottomSheetHeader, BottomSheetScrollView, Box } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { CardTransactionDetail } from "../CardTransactions/components/Detail";
import { useCardTransactionDetailDialog } from "../CardTransactions/useCardTransactionDetailDialog";
import { CardTransactionHistoryView } from "./CardTransactionHistoryView";
import { useCardTransactionHistoryViewModel } from "./useCardTransactionHistoryViewModel";
import type { CardTransactionHistoryProps } from "./types";

export function CardTransactionHistory(props: CardTransactionHistoryProps) {
  const detail = useCardTransactionDetailDialog({
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
          <BottomSheetScrollView>
            <Box lx={{ paddingBottom: "s24" }}>
              <BottomSheetHeader density="compact" spacing />
              <CardTransactionDetail
                transaction={detail.selectedTransaction}
                formatters={props.formatters}
              />
            </Box>
          </BottomSheetScrollView>
        ) : null}
      </QueuedBottomSheet>
    </>
  );
}

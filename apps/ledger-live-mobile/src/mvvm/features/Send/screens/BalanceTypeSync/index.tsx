import React from "react";
import { BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import type { BalanceTypeSyncSheetViewModel } from "../BalanceType/hooks/useBalanceTypeScreenViewModel";
import { useBalanceTypeSyncScreenViewModel } from "./hooks/useBalanceTypeSyncScreenViewModel";

export function BalanceTypeSyncSheet({
  isOpen,
  onClose,
  onComplete,
}: BalanceTypeSyncSheetViewModel) {
  const viewModel = useBalanceTypeSyncScreenViewModel();
  const { bottom: bottomInset } = useSafeAreaInsets();

  if (!viewModel.ready) {
    return null;
  }

  const { SyncComponent, account, transaction } = viewModel;

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      enableDynamicSizing
      testID="balance-type-sync-sheet"
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <SyncComponent
          key={account.id}
          account={account}
          transaction={transaction}
          onComplete={onComplete}
          onClose={onClose}
        />
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}

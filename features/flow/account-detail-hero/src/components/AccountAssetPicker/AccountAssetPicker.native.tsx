import React from "react";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import type { AccountAssetPickerProps } from "./AccountAssetPicker.types";
import { AccountAssetPickerContent } from "./Content/AccountAssetPickerContent.native";
import { useAccountAssetPickerViewModel } from "./hooks/useAccountAssetPickerViewModel";

export function AccountAssetPicker({
  open,
  rows,
  onSelect,
  onClose,
  testID,
}: AccountAssetPickerProps) {
  const viewModel = useAccountAssetPickerViewModel({ open, rows });

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={open}
      onClose={onClose}
      onModalHide={viewModel.onHidden}
      snapPoints="fullWithOffset"
      enableHandlePanningGesture={false}
      testID={testID}
    >
      {viewModel.isContentMounted ? (
        <AccountAssetPickerContent rows={viewModel.rows} onSelect={onSelect} testID={testID} />
      ) : null}
    </QueuedBottomSheet>
  );
}

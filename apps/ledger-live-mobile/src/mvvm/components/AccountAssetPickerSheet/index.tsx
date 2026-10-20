import React from "react";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { AccountAssetPickerSheetView } from "./AccountAssetPickerSheetView";
import type { AccountAssetPickerSheetProps } from "./useAccountAssetPicker";
import { useAccountAssetPickerSheetViewModel } from "./useAccountAssetPickerSheetViewModel";

type Props = AccountAssetPickerSheetProps & Readonly<{ testID?: string }>;

function AccountAssetPickerSheetContent({
  assets,
  onSelect,
  testID,
}: Pick<Props, "assets" | "onSelect" | "testID">) {
  const viewModel = useAccountAssetPickerSheetViewModel(assets, onSelect);
  return <AccountAssetPickerSheetView {...viewModel} testID={testID} />;
}

export function AccountAssetPickerSheet({ isOpen, assets, onSelect, onClose, testID }: Props) {
  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      enableDynamicSizing
      contentHasBottomSpace
      testID={testID}
    >
      <AccountAssetPickerSheetContent assets={assets} onSelect={onSelect} testID={testID} />
    </QueuedBottomSheet>
  );
}

import React from "react";
import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import { AddToWalletInstructions } from "../AddToWalletInstructions/AddToWalletInstructions.native";
import type { AddToWalletBottomSheetViewProps } from "./useAddToWalletBottomSheetViewModel.native";

export function AddToWalletBottomSheetView({ isOpen, onClose }: AddToWalletBottomSheetViewProps) {
  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      enableDynamicSizing
      testID="pay-card-add-to-wallet-sheet"
    >
      {isOpen ? <AddToWalletBottomSheetContent onDone={onClose} /> : null}
    </QueuedBottomSheet>
  );
}

function AddToWalletBottomSheetContent({ onDone }: Readonly<{ onDone: () => void }>) {
  const bottomInset = useBottomSheetBottomInset();

  return (
    <BottomSheetView
      style={{ paddingBottom: bottomInset + 24 }}
      testID="pay-card-add-to-wallet-sheet-content"
    >
      <BottomSheetHeader spacing density="expanded" />
      <AddToWalletInstructions onDone={onDone} />
    </BottomSheetView>
  );
}

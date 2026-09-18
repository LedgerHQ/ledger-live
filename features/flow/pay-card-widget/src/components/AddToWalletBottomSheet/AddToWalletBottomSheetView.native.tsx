import React from "react";
import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
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
      {isOpen ? (
        <BottomSheetView testID="pay-card-add-to-wallet-sheet-content">
          <BottomSheetHeader spacing density="expanded" />
          <AddToWalletInstructions onDone={onClose} />
        </BottomSheetView>
      ) : null}
    </QueuedBottomSheet>
  );
}

import React from "react";
import { AddToWalletBottomSheetView } from "./AddToWalletBottomSheetView";
import { useAddToWalletBottomSheetViewModel } from "./useAddToWalletBottomSheetViewModel";

export type AddToWalletBottomSheetProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
};

export function AddToWalletBottomSheet(props: AddToWalletBottomSheetProps) {
  return <AddToWalletBottomSheetView {...useAddToWalletBottomSheetViewModel(props)} />;
}

import React from "react";
import { AddToWalletBottomSheetView } from "./AddToWalletBottomSheetView.native";
import { useAddToWalletBottomSheetViewModel } from "./useAddToWalletBottomSheetViewModel.native";

export type AddToWalletBottomSheetProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
};

export function AddToWalletBottomSheet(props: AddToWalletBottomSheetProps) {
  return <AddToWalletBottomSheetView {...useAddToWalletBottomSheetViewModel(props)} />;
}

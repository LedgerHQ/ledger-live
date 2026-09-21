import React from "react";
import { AddToWalletInstructionsView } from "./AddToWalletInstructionsView.native";
import { useAddToWalletInstructionsViewModel } from "./useAddToWalletInstructionsViewModel";

export type AddToWalletInstructionsProps = {
  readonly onDone: () => void;
};

export function AddToWalletInstructions(props: AddToWalletInstructionsProps) {
  return <AddToWalletInstructionsView {...useAddToWalletInstructionsViewModel(props)} />;
}

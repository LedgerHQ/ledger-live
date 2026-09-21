import React from "react";
import { WalletErrorScene } from "./WalletErrorScene.native";
import { WalletInstructionsScene } from "./WalletInstructionsScene.native";
import type { AddToWalletInstructionsViewProps } from "./useAddToWalletInstructionsViewModel";

export function AddToWalletInstructionsView(props: AddToWalletInstructionsViewProps) {
  switch (props.scene) {
    case "instructions":
      return <WalletInstructionsScene {...props} />;
    case "error":
      return <WalletErrorScene {...props} />;
  }
}

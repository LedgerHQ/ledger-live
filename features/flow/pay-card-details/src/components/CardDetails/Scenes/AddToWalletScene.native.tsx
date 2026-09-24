import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { AddToWalletInstructions } from "@features/flow-pay-card-widget/native";
import type { AddToWalletSceneProps } from "./types";

export function AddToWalletScene({ onDone }: AddToWalletSceneProps) {
  return (
    <Box testID="card-details-add-to-wallet-content">
      <AddToWalletInstructions onDone={onDone} />
    </Box>
  );
}

import React from "react";
import {
  getSwapTransactionStatusVisualTokens,
  type SwapTransactionStatusDisplayStatus,
  type SwapTransactionStatusVisualTone,
} from "@ledgerhq/live-common/exchange/swapTransactionStatus/index";
import { Box } from "@ledgerhq/lumen-ui-rnative";

type StatusLineProps = Readonly<{
  status: SwapTransactionStatusDisplayStatus;
}>;

export function StatusLine({ status }: StatusLineProps) {
  return (
    <Box
      lx={{
        backgroundColor: getStatusLineBackgroundColor(status),
        borderRadius: "full",
        height: "s32",
        width: "s4",
        marginTop: "s4",
      }}
    />
  );
}

function getStatusLineBackgroundColor(status: SwapTransactionStatusDisplayStatus) {
  return getStatusLineBackgroundColorFromTone(getSwapTransactionStatusVisualTokens(status).tone);
}

function getStatusLineBackgroundColorFromTone(tone: SwapTransactionStatusVisualTone) {
  if (tone === "success") {
    return "successStrong";
  }
  if (tone === "error") {
    return "errorStrong";
  }
  return "mutedStrong";
}

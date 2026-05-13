import React from "react";
import {
  getSwapTransactionStatusVisualTokens,
  type SwapTransactionStatusDisplayStatus,
} from "@ledgerhq/live-common/exchange/swapTransactionStatus/index";
import { cn } from "LLD/utils/cn";

type StatusLineProps = Readonly<{
  status: SwapTransactionStatusDisplayStatus;
}>;

export function StatusLine({ status }: StatusLineProps) {
  const visualTokens = getSwapTransactionStatusVisualTokens(status);

  return (
    <div
      className={cn("bg-muted-strong h-full w-4 mt-4 rounded-full", {
        "bg-success-strong": visualTokens.tone === "success",
        "bg-error-strong": visualTokens.tone === "error",
      })}
    />
  );
}

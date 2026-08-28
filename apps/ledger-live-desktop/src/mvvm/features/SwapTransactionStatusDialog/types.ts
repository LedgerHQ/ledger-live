import type { SwapTransactionStatusParams } from "@ledgerhq/live-common/exchange/swapTransactionStatus/index";

export type SwapTransactionStatusOrigin = "swap" | "perps";

export type SwapTransactionStatusDialogParams = SwapTransactionStatusParams & {
  origin?: SwapTransactionStatusOrigin;
};

import type { SwapStatus } from "../swap/types";

export type SwapTransactionStatusKind = "swap";

export type SwapTransactionStatusRawParams = {
  kind?: SwapTransactionStatusKind;
  swapId?: string;
  provider?: string;
  redirectUrl?: string;
};

export type SwapTransactionStatusParams = {
  kind: SwapTransactionStatusKind;
  swapId: string;
  provider?: string;
  redirectUrl?: string;
};

export type SwapTransactionStatusParamsErrorCode = "unsupported_kind" | "missing_swap_id";

export type SwapTransactionStatusParamsError = {
  code: SwapTransactionStatusParamsErrorCode;
  value?: string;
  message: string;
};

export type SwapTransactionStatusParseResult =
  | { ok: true; params: SwapTransactionStatusParams }
  | { ok: false; error: SwapTransactionStatusParamsError };

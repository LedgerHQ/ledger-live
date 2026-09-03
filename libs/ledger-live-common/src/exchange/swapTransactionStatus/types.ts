export type SwapTransactionStatusRawParams = {
  swapId?: string;
  provider?: string;
  redirectUrl?: string;
};

/** The flow that opened the status view, which titles it in its own terms. */
export type SwapTransactionStatusOrigin = "swap" | "perps";

export type SwapTransactionStatusParams = {
  swapId: string;
  provider?: string;
  redirectUrl?: string;
  origin?: SwapTransactionStatusOrigin;
};

export type SwapTransactionStatusParamsErrorCode = "missing_swap_id";

export type SwapTransactionStatusParamsError = {
  code: SwapTransactionStatusParamsErrorCode;
  value?: string;
  message: string;
};

export type SwapTransactionStatusParseResult =
  | { ok: true; params: SwapTransactionStatusParams }
  | { ok: false; error: SwapTransactionStatusParamsError };

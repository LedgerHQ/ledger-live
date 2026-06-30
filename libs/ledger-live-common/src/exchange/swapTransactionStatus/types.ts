export type SwapTransactionStatusRawParams = {
  swapId?: string;
  provider?: string;
  redirectUrl?: string;
};

export type SwapTransactionStatusParams = {
  swapId: string;
  provider?: string;
  redirectUrl?: string;
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

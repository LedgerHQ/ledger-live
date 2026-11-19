export type ExchangeErrorData = {
  code: string;
  message: string;
  data?: Record<string, unknown>;
};

export function createWrongSwapParams(params: unknown): ExchangeErrorData {
  return {
    code: "WRONG_SWAP_PARAMS",
    message: "swap params are not correctly set",
    data: {
      params,
    },
  };
}

export function createWrongSellParams(params: unknown): ExchangeErrorData {
  return {
    code: "WRONG_SELL_PARAMS",
    message: "sell params are not correctly set",
    data: {
      params,
    },
  };
}

export function createWrongFundParams(params: unknown): ExchangeErrorData {
  return {
    code: "WRONG_FUND_PARAMS",
    message: "fund params are not correctly set",
    data: {
      params,
    },
  };
}

export function createAccounIdNotFound(accountId: string): ExchangeErrorData {
  return {
    code: "ACCOUNT_ID_NOT_FOUND",
    message: "unable to find account id in current wallet",
    data: {
      accountId,
    },
  };
}

export function createWrongTronifyParams(params: unknown): ExchangeErrorData {
  return {
    code: "WRONG_TRONIFY_PARAMS",
    message: "tronify params are not correctly set",
    data: { params },
  };
}

export function createTronifyUnsupportedAccount(accountId: string): ExchangeErrorData {
  return {
    code: "TRONIFY_UNSUPPORTED_ACCOUNT",
    message: "tronify energy rental needs a TRON TRC-20 token account",
    data: { accountId },
  };
}

export function createTronifyDisabled(): ExchangeErrorData {
  return {
    code: "TRONIFY_DISABLED",
    message: "tronify energy rental is disabled",
  };
}

export function createTronifyUnavailable(): ExchangeErrorData {
  return {
    code: "TRONIFY_UNAVAILABLE",
    message: "tronify energy rental is not available on this wallet",
  };
}

export function createTronifyUnsupportedTransfer(reason: string): ExchangeErrorData {
  return {
    code: "TRONIFY_UNSUPPORTED_TRANSFER",
    message: `tronify energy rental does not support this transfer: ${reason}`,
  };
}

export function createTronifyQuoteFailed(reason: string): ExchangeErrorData {
  return {
    code: "TRONIFY_QUOTE_FAILED",
    message: `tronify quote failed: ${reason}`,
  };
}

export function createTronifyInsufficientBalance(): ExchangeErrorData {
  return {
    code: "TRONIFY_INSUFFICIENT_BALANCE",
    message: "tronify energy rental needs a balance that covers the transfer plus the rent",
  };
}

export function createTronifyPriceAboveApproved(offeredBaseUnits: string): ExchangeErrorData {
  return {
    code: "TRONIFY_PRICE_ABOVE_APPROVED",
    message: `tronify rent of ${offeredBaseUnits} base units is above the approved fee`,
  };
}

export function createTronifyRentPending(): ExchangeErrorData {
  return {
    code: "TRONIFY_RENT_PENDING",
    message: "tronify energy rented for this account has not landed yet",
  };
}

export function createTronifyOrderFailed(reason: string): ExchangeErrorData {
  return {
    code: "TRONIFY_ORDER_FAILED",
    message: `tronify rent order failed: ${reason}`,
  };
}

export function createTronifyOrderNotFound(orderId: string): ExchangeErrorData {
  return {
    code: "TRONIFY_ORDER_NOT_FOUND",
    message: "tronify rent order is unknown, expired or already submitted",
    data: { orderId },
  };
}

export function createTronifyUploadFailed(reason: string): ExchangeErrorData {
  return {
    code: "TRONIFY_UPLOAD_FAILED",
    message: `tronify rent payment upload failed: ${reason}`,
  };
}

/**
 * Extends `Error` so that the wallet-api serializer keeps `message` and `cause` (the code) on the
 * wire. The live app reads the code from `cause`.
 */
export class ExchangeError extends Error {
  override readonly name = "ExchangeError";
  override readonly cause: string;

  constructor({ code, message }: ExchangeErrorData) {
    super(message);
    this.cause = code;
  }
}

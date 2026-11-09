type ExchangeErrorData = {
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

export class ExchangeError implements Error {
  readonly name = "ExchangeError";
  get message() {
    return this.context.message;
  }
  get cause() {
    return this.context.code;
  }

  private context: ExchangeErrorData;

  constructor(context: ExchangeErrorData) {
    this.context = context;
  }
}

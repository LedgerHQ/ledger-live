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

export function createAccounIdNotFound(accountId: string): ExchangeErrorData {
  return {
    code: "ACCOUNT_ID_NOT_FOUND",
    message: "unable to find account id in current wallet",
    data: {
      accountId,
    },
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

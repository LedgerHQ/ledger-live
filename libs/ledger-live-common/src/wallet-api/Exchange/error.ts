export function createWrongSwapParams(params: unknown) {
  return {
    code: "WRONG_SWAP_PARAMS",
    message: "swap params are not correctly set",
    data: {
      params,
    },
  };
}

export function createWrongSellParams(params: unknown) {
  return {
    code: "WRONG_SELL_PARAMS",
    message: "sell params are not correctly set",
    data: {
      params,
    },
  };
}

export function createAccounIdNotFound(accountId: string) {
  return {
    code: "ACCOUNT_ID_NOT_FOUND",
    message: "unable to find account id in current wallet",
    data: {
      accountId,
    },
  };
}

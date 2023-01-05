import { BigNumber } from "bignumber.js";
import type { ZilliqaAccount, Transaction } from "./types";
import { BN } from "@zilliqa-js/util";
import { ZILLIQA_TX_GAS_LIMIT, getMinimumGasPrice } from "./api";

const isSame = (a, b) => (!a || !b ? false : a === b);

export const createTransaction = (_a: ZilliqaAccount): Transaction => {
  return {
    family: "zilliqa",
    amount: new BigNumber(0),
    recipient: "",
    gasLimit: new BN(ZILLIQA_TX_GAS_LIMIT),
    gasPrice: new BN(0),
  };
};

export const updateTransaction = (t, patch) => {
  return { ...t, ...patch };
};

export const prepareTransaction = async (
  _a: ZilliqaAccount,
  t: Transaction
): Promise<Transaction> => {
  const gasLimit = new BN(ZILLIQA_TX_GAS_LIMIT);
  const gasPrice = await getMinimumGasPrice();
  if (!isSame(gasLimit, t.gasLimit) || !isSame(gasPrice, t.gasPrice)) {
    return {
      ...t,
      gasLimit,
      gasPrice,
    };
  }
  return t;
};

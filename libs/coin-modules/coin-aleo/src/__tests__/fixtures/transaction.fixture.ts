import BigNumber from "bignumber.js";
import type { Transaction, TransactionRaw } from "../../types";
import { TRANSACTION_TYPE } from "../../constants";

export const getMockedTransaction = (overrides?: Partial<Transaction>): Transaction => {
  return {
    family: "aleo",
    amount: new BigNumber(0),
    recipient: "aleo1a2ehlgqhvs3p7d4hqhs0tvgk954dr8gafu9kxse2mzu9a5sqxvpsrn98pr",
    fees: new BigNumber(0),
    useAllAmount: false,
    type: TRANSACTION_TYPE.TRANSFER_PUBLIC,
    ...overrides,
  };
};

export const getMockedTransactionRaw = (overrides?: Partial<TransactionRaw>): TransactionRaw => {
  return {
    family: "aleo",
    amount: "0",
    recipient: "aleo1a2ehlgqhvs3p7d4hqhs0tvgk954dr8gafu9kxse2mzu9a5sqxvpsrn98pr",
    fees: "0",
    useAllAmount: false,
    ...overrides,
  };
};

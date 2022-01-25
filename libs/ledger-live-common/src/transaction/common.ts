import { BigNumber } from "bignumber.js";
import type {
  TransactionCommon,
  TransactionCommonRaw,
} from "../types/transaction";
import type { Transaction, TransactionRaw } from "../types";
export const fromTransactionCommonRaw = (
  raw: TransactionRaw
): TransactionCommon => {
  const common: TransactionCommon = {
    amount: new BigNumber(raw.amount),
    recipient: raw.recipient,
  };

  if ("useAllAmount" in raw) {
    common.useAllAmount = raw.useAllAmount;
  }

  if ("subAccountId" in raw) {
    common.subAccountId = raw.subAccountId;
  }

  return common;
};
export const toTransactionCommonRaw = (
  raw: Transaction
): TransactionCommonRaw => {
  const common: TransactionCommonRaw = {
    amount: raw.amount.toString(),
    recipient: raw.recipient,
  };

  if ("useAllAmount" in raw) {
    common.useAllAmount = raw.useAllAmount;
  }

  if ("subAccountId" in raw) {
    common.subAccountId = raw.subAccountId;
  }

  return common;
};

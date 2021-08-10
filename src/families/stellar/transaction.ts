import { BigNumber } from "bignumber.js";
import type { Transaction, TransactionRaw } from "./types";
import {
  fromTransactionCommonRaw,
  toTransactionCommonRaw,
} from "../../transaction/common";
import type { Account } from "../../types";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";

export const formatTransaction = (
  { amount, recipient, fees, memoValue, useAllAmount }: Transaction,
  account: Account
): string => `
    SEND ${
      useAllAmount
        ? "MAX"
        : formatCurrencyUnit(getAccountUnit(account), amount, {
            showCode: true,
            disableRounding: true,
          })
    }
    TO ${recipient}
    with fees=${
      !fees
        ? "?"
        : formatCurrencyUnit(getAccountUnit(account), fees, {
            showCode: true,
            disableRounding: true,
          })
    }${memoValue ? "\n  memo=" + memoValue : ""}`;

const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  const { networkInfo } = tr;
  return {
    ...common,
    family: tr.family,
    fees: tr.fees ? new BigNumber(tr.fees) : null,
    baseReserve: tr.baseReserve ? new BigNumber(tr.baseReserve) : null,
    memoValue: tr.memoValue ? tr.memoValue : null,
    memoType: tr.memoType ? tr.memoType : null,
    networkInfo: networkInfo && {
      family: networkInfo.family,
      fees: new BigNumber(networkInfo.fees),
      baseReserve: new BigNumber(networkInfo.baseReserve),
    },
  };
};

const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  const { networkInfo } = t;
  return {
    ...common,
    family: t.family,
    fees: t.fees ? t.fees.toString() : null,
    baseReserve: t.baseReserve ? t.baseReserve.toString() : null,
    memoValue: t.memoValue ? t.memoValue.toString() : null,
    memoType: t.memoType ? t.memoType.toString() : null,
    networkInfo: networkInfo && {
      family: networkInfo.family,
      fees: networkInfo.fees.toString(),
      baseReserve: networkInfo.baseReserve.toString(),
    },
  };
};

export default {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
};

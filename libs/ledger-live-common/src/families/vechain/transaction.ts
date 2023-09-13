import type { Transaction, TransactionRaw, TransactionStatus, TransactionStatusRaw } from "./types";
import {
  formatTransactionStatusCommon as formatTransactionStatus,
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon,
} from "@ledgerhq/coin-framework/transaction/common";
import type { Account } from "@ledgerhq/types-live";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";

export const formatTransaction = (t: Transaction, account: Account): string => {
  const { amount, recipient, useAllAmount } = t;
  let displayedAmount: string;
  if (useAllAmount) {
    displayedAmount = "MAX";
  } else if (amount.isZero()) {
    displayedAmount = "";
  } else {
    displayedAmount =
      " " +
      formatCurrencyUnit(getAccountUnit(account), amount, {
        showCode: true,
        disableRounding: true,
      });
  }
  return `SEND ${displayedAmount} TO ${recipient}`;
};

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);

  return {
    ...tr,
    ...common,
  };
};

export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);

  return {
    ...t,
    ...common,
  };
};

export const fromTransactionStatusRaw = (ts: TransactionStatusRaw): TransactionStatus => {
  const common = fromTransactionStatusRawCommon(ts);

  return {
    ...ts,
    ...common,
  };
};

export const toTransactionStatusRaw = (ts: TransactionStatus): TransactionStatusRaw => {
  const common = toTransactionStatusRawCommon(ts);

  return {
    ...ts,
    ...common,
  };
};

export default {
  formatTransaction,
  formatTransactionStatus,
  fromTransactionRaw,
  toTransactionRaw,
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
};

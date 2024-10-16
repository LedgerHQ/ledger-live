import { getAccountCurrency } from "@ledgerhq/coin-framework/lib/account/index";
import type { Transaction, TransactionRaw, TransactionStatus, TransactionStatusRaw } from "./types";
import { formatTransactionStatus } from "@ledgerhq/coin-framework/formatters";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/lib/currencies/index";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon,
} from "@ledgerhq/coin-framework/serialization";
import type { Account } from "@ledgerhq/types-live";

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
      formatCurrencyUnit(getAccountCurrency(account).units[0], amount, {
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

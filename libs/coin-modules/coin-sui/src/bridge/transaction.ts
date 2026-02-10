import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies";
import { formatTransactionStatus } from "@ledgerhq/coin-framework/formatters";
import {
  fromTransactionCommonRaw,
  toTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/coin-framework/serialization";
import type { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { Transaction, TransactionRaw } from "../types";
import { getAccountUnit } from "./utils";

export const formatTransaction = (transaction: Transaction, account: Account): string => {
  const { mode, amount, recipient, useAllAmount } = transaction;
  return `
${mode.toUpperCase()} ${
    useAllAmount
      ? "MAX"
      : amount.isZero()
        ? ""
        : " " +
          formatCurrencyUnit(getAccountUnit(account), amount, {
            showCode: true,
            disableRounding: true,
          })
  }${recipient ? `\nTO ${recipient}` : ""}`;
};

export const fromTransactionRaw = (transaction: TransactionRaw): Transaction => {
  if (!transaction.amount) {
    transaction.amount = "0";
  }
  const common = fromTransactionCommonRaw(transaction);
  return {
    ...common,
    family: transaction.family,
    mode: transaction.mode,
    coinType: transaction.coinType,
    fees: transaction.fees ? BigNumber(transaction.fees) : null,
    errors: {},
  };
};

export const toTransactionRaw = (transaction: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(transaction);
  return {
    ...common,
    family: transaction.family,
    mode: transaction.mode,
    coinType: transaction.coinType,
    fees: transaction.fees?.toString() || "",
  };
};

export default {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
  formatTransactionStatus,
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
};

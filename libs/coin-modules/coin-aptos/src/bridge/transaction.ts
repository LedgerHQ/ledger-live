import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { formatTransactionStatus } from "@ledgerhq/coin-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/coin-framework/serialization";
import { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { Transaction, TransactionRaw } from "../types";

export const formatTransaction = (
  { mode, amount, fees, recipient, useAllAmount }: Transaction,
  account: Account,
): string => {
  return `
${mode.toUpperCase()} ${
    useAllAmount
      ? "MAX"
      : amount.isZero()
        ? ""
        : " " + formatCurrencyUnit(account.currency.units[0], amount)
  }
TO ${recipient}
with fees=${fees ? formatCurrencyUnit(account.currency.units[0], fees) : "?"}`;
};

export const fromTransactionRaw = (t: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(t);
  return {
    ...common,
    family: t.family,
    mode: t.mode,
    options: JSON.parse(t.options),
    ...(t.fees && { fees: new BigNumber(t.fees) }),
    ...(t.errors && { errors: JSON.parse(t.errors) }),
  };
};

export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  return {
    ...common,
    family: t.family,
    mode: t.mode,
    options: JSON.stringify(t.options),
    ...(t.fees && { fees: t.fees.toString() }),
    ...(t.errors && { errors: JSON.stringify(t.errors) }),
  };
};

export default {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
  formatTransactionStatus,
};

import { BigNumber } from "bignumber.js";
import type { Transaction, TransactionRaw } from "./types";
import {
  formatTransactionStatusCommon as formatTransactionStatus,
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/coin-framework/transaction/common";
import { Account } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "../../currencies";
import { getAccountUnit } from "../../account";

export const formatTransaction = (
  { mode, amount, fees, recipient, useAllAmount }: Transaction,
  account: Account
): string => `
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
}
TO ${recipient}
with fees=${fees ? formatCurrencyUnit(getAccountUnit(account), fees) : "?"}`;

export const fromTransactionRaw = (t: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(t);
  return {
    ...common,
    family: t.family,
    mode: t.mode,
    fees: t.fees ? new BigNumber(t.fees) : null,
    options: JSON.parse(t.options),
    estimate: JSON.parse(t.estimate),
    firstEmulation: JSON.parse(t.firstEmulation),
    skipEmulation: t.skipEmulation ? JSON.parse(t.skipEmulation) : null,
    errors: t.errors ? JSON.parse(t.errors) : {},
  };
};

export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  return {
    ...common,
    family: t.family,
    mode: t.mode,
    fees: t.fees ? t.fees.toString() : null,
    options: JSON.stringify(t.options),
    estimate: JSON.stringify(t.estimate),
    firstEmulation: JSON.stringify(t.firstEmulation),
    skipEmulation: JSON.stringify(t.skipEmulation || false),
    errors: JSON.stringify(t.errors),
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

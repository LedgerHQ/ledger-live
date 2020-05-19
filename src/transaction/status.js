// @flow

import mapValues from "lodash/mapValues";
import { BigNumber } from "bignumber.js";
import { deserializeError, serializeError } from "@ledgerhq/errors";
import type {
  TransactionCommon,
  TransactionStatusRaw,
  TransactionStatus,
} from "../types/transaction";
import type { Account } from "../types";
import { getAccountUnit } from "../account";
import { formatCurrencyUnit } from "../currencies";

const fromErrorRaw = (raw: string): Error => {
  return deserializeError(JSON.parse(raw));
};

const toErrorRaw = (raw: Error): string =>
  JSON.stringify(serializeError(raw)) || "{}";

export const fromTransactionStatusRaw = (
  ts: TransactionStatusRaw
): TransactionStatus => ({
  errors: mapValues(ts.errors, fromErrorRaw),
  warnings: mapValues(ts.warnings, fromErrorRaw),
  estimatedFees: BigNumber(ts.estimatedFees),
  amount: BigNumber(ts.amount),
  totalSpent: BigNumber(ts.totalSpent),
  recipientIsReadOnly: ts.recipientIsReadOnly,
});

export const toTransactionStatusRaw = (
  ts: TransactionStatus
): TransactionStatusRaw => ({
  errors: mapValues(ts.errors, toErrorRaw),
  warnings: mapValues(ts.warnings, toErrorRaw),
  estimatedFees: ts.estimatedFees.toString(),
  amount: ts.amount.toString(),
  totalSpent: ts.totalSpent.toString(),
  recipientIsReadOnly: ts.recipientIsReadOnly,
});

const formatErrorSmall = (e: Error): string =>
  e.name === "Error" ? e.message : e.name;

export const formatTransactionStatus = (
  t: TransactionCommon,
  { errors, warnings, estimatedFees, amount, totalSpent }: TransactionStatus,
  mainAccount: Account
): string => {
  let str = "";
  const account =
    (t.subAccountId &&
      (mainAccount.subAccounts || []).find((a) => a.id === t.subAccountId)) ||
    mainAccount;

  str +=
    "\n  amount: " +
    formatCurrencyUnit(getAccountUnit(account), amount, { showCode: true });

  str +=
    "\n  estimated fees: " +
    formatCurrencyUnit(getAccountUnit(mainAccount), estimatedFees, {
      showCode: true,
    });

  str +=
    "\n  total spent: " +
    formatCurrencyUnit(getAccountUnit(account), totalSpent, { showCode: true });

  const errorKeys = Object.keys(errors);
  if (errorKeys.length) {
    str +=
      "\n  errors: " +
      errorKeys.map((k) => `${k}: ${formatErrorSmall(errors[k])}`).join(", ");
  }
  const warningKeys = Object.keys(warnings);
  if (warningKeys.length) {
    str +=
      "\n  warnings: " +
      warningKeys
        .map((k) => `${k}: ${formatErrorSmall(warnings[k])}`)
        .join(", ");
  }
  return str;
};

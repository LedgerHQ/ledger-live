import { deserializeError, serializeError } from "@ledgerhq/errors";
import type {
  Account,
  TransactionCommon,
  TransactionCommonRaw,
} from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { mapValues } from "lodash";
import { getAccountUnit } from "../account";
import { formatCurrencyUnit } from "../currencies";
import type {
  Transaction,
  TransactionRaw,
  TransactionStatus,
  TransactionStatusRaw,
} from "../types";
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

const fromErrorRaw = (raw: string): Error => {
  return deserializeError(JSON.parse(raw));
};

const toErrorRaw = (raw: Error): string =>
  JSON.stringify(serializeError(raw)) || "{}";

export const fromTransactionStatusRawCommon = (
  ts: TransactionStatusRaw
): TransactionStatus => ({
  errors: mapValues(ts.errors, fromErrorRaw),
  warnings: mapValues(ts.warnings, fromErrorRaw),
  estimatedFees: new BigNumber(ts.estimatedFees),
  amount: new BigNumber(ts.amount),
  totalSpent: new BigNumber(ts.totalSpent),
  recipientIsReadOnly: ts.recipientIsReadOnly,
  family: ts.family,
});

export const toTransactionStatusRawCommon = (
  ts: TransactionStatus
): TransactionStatusRaw => ({
  errors: mapValues(ts.errors, toErrorRaw),
  warnings: mapValues(ts.warnings, toErrorRaw),
  estimatedFees: ts.estimatedFees.toString(),
  amount: ts.amount.toString(),
  totalSpent: ts.totalSpent.toString(),
  recipientIsReadOnly: ts.recipientIsReadOnly,
  family: ts.family,
});

const formatErrorSmall = (e: Error): string =>
  e.name === "Error" ? e.message : e.name;

export const formatTransactionStatusCommon = (
  t: Transaction,
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
    formatCurrencyUnit(getAccountUnit(account), amount, {
      showCode: true,
      disableRounding: true,
    });
  str +=
    "\n  estimated fees: " +
    formatCurrencyUnit(getAccountUnit(mainAccount), estimatedFees, {
      showCode: true,
      disableRounding: true,
    });
  str +=
    "\n  total spent: " +
    formatCurrencyUnit(getAccountUnit(account), totalSpent, {
      showCode: true,
      disableRounding: true,
    });
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

import { deserializeError, serializeError } from "@ledgerhq/errors";
import type {
  Account,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { mapValues } from "lodash";

import { getAccountUnit } from "../account";
import { formatCurrencyUnit } from "../currencies";

type tooltipArgs = Record<string, string>;
export type CommonDeviceTransactionField =
  | {
      type: "amount";
      label: string;
    }
  | {
      type: "address";
      label: string;
      address: string;
    }
  | {
      type: "fees";
      label: string;
    }
  | {
      type: "text";
      label: string;
      value: string;
      tooltipI18nKey?: string;
      tooltipI18nArgs?: tooltipArgs;
    };

export const fromTransactionCommonRaw = (
  raw: TransactionCommonRaw
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

  if ("recipientDomain" in raw) {
    common.recipientDomain = raw.recipientDomain;
  }

  return common;
};

export const toTransactionCommonRaw = (
  raw: TransactionCommon
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

  if ("recipientDomain" in raw) {
    common.recipientDomain = raw.recipientDomain;
  }

  return common;
};

const fromErrorRaw = (raw: string): Error => {
  return deserializeError(JSON.parse(raw)) || new Error("unknown reason");
};

const toErrorRaw = (raw: Error): string =>
  JSON.stringify(serializeError(raw)) || "{}";

export const fromTransactionStatusRawCommon = (
  ts: TransactionStatusCommonRaw
): TransactionStatusCommon => ({
  errors: mapValues(ts.errors, fromErrorRaw),
  warnings: mapValues(ts.warnings, fromErrorRaw),
  estimatedFees: new BigNumber(ts.estimatedFees),
  amount: new BigNumber(ts.amount),
  totalSpent: new BigNumber(ts.totalSpent),
  recipientIsReadOnly: ts.recipientIsReadOnly,
});

export const toTransactionStatusRawCommon = (
  ts: TransactionStatusCommon
): TransactionStatusCommonRaw => ({
  errors: mapValues<Record<string, Error>, string>(ts.errors, toErrorRaw),
  warnings: mapValues<Record<string, Error>, string>(ts.warnings, toErrorRaw),
  estimatedFees: ts.estimatedFees.toString(),
  amount: ts.amount.toString(),
  totalSpent: ts.totalSpent.toString(),
  recipientIsReadOnly: ts.recipientIsReadOnly,
});

const formatErrorSmall = (e: Error): string =>
  e.name === "Error" ? e.message : e.name;

export const formatTransactionStatusCommon = (
  t: TransactionCommon,
  {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  }: TransactionStatusCommon,
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

  str +=
    "\n" +
    `errors: ${Object.entries(errors)
      .map(([key, error]) => `${key} ${formatErrorSmall(error)}`)
      .join(", ")}`;

  str +=
    "\n" +
    `errors: ${Object.entries(warnings)
      .map(([key, warning]) => `${key} ${formatErrorSmall(warning)}`)
      .join(", ")}`;

  return str;
};

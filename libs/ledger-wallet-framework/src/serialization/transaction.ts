import type {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import mapValues from "lodash/mapValues";

export const fromTransactionCommonRaw = (raw: TransactionCommonRaw): TransactionCommon => {
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

export const toTransactionCommonRaw = (raw: TransactionCommon): TransactionCommonRaw => {
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
  try {
    const obj = JSON.parse(raw);
    if (obj !== null && typeof obj === "object") {
      const error = new Error(typeof obj.message === "string" ? obj.message : "unknown");
      if (typeof obj.name === "string") error.name = obj.name;
      if (typeof obj.stack === "string") error.stack = obj.stack;
      return error;
    }
  } catch {
    // fall through
  }
  return new Error("unknown reason");
};

export const toErrorRaw = (raw: Error): string => {
  const obj: Record<string, unknown> = { name: raw.name, message: raw.message };
  if (raw.stack) obj.stack = raw.stack;
  return JSON.stringify(obj) || "{}";
};

export const fromTransactionStatusRawCommon = (
  ts: TransactionStatusCommonRaw,
): TransactionStatusCommon => ({
  errors: mapValues(ts.errors, fromErrorRaw),
  warnings: mapValues(ts.warnings, fromErrorRaw),
  estimatedFees: new BigNumber(ts.estimatedFees),
  amount: new BigNumber(ts.amount),
  totalSpent: new BigNumber(ts.totalSpent),
  recipientIsReadOnly: ts.recipientIsReadOnly,
  feeCurrencyAccountId: ts.feeCurrencyAccountId,
});

export const toTransactionStatusRawCommon = (
  ts: TransactionStatusCommon,
): TransactionStatusCommonRaw => ({
  errors: mapValues<Record<string, Error>, string>(ts.errors, toErrorRaw),
  warnings: mapValues<Record<string, Error>, string>(ts.warnings, toErrorRaw),
  estimatedFees: ts.estimatedFees.toString(),
  amount: ts.amount.toString(),
  totalSpent: ts.totalSpent.toString(),
  recipientIsReadOnly: ts.recipientIsReadOnly,
  feeCurrencyAccountId: ts.feeCurrencyAccountId,
});

import { deserializeError, serializeError } from "@ledgerhq/errors";
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
  return deserializeError(JSON.parse(raw)) || new Error("unknown reason");
};

export const toErrorRaw = (raw: Error): string => JSON.stringify(serializeError(raw)) || "{}";

export const fromTransactionStatusRawCommon = (
  ts: TransactionStatusCommonRaw,
): TransactionStatusCommon => ({
  errors: mapValues(ts.errors, fromErrorRaw),
  warnings: mapValues(ts.warnings, fromErrorRaw),
  estimatedFees: new BigNumber(ts.estimatedFees),
  amount: new BigNumber(ts.amount),
  totalSpent: new BigNumber(ts.totalSpent),
  recipientIsReadOnly: ts.recipientIsReadOnly,
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
});

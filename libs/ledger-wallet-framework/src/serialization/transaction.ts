import * as sharedErrors from "@ledgerhq/errors";
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

// Local registry of the shared Ledger error classes, so that `instanceof` keeps
// working after a TransactionStatus crossed a JSON boundary. Replaces the former
// global `deserializeError` registry from @ledgerhq/errors (now deprecated). Errors
// not defined in @ledgerhq/errors (e.g. coin-specific ones) are reconstructed as
// a plain Error with their original name/message preserved.
const errorClassByName = new Map<string, new (message?: string) => Error>();
for (const value of Object.values(sharedErrors)) {
  if (typeof value === "function" && value.prototype instanceof Error) {
    const ctor = value as unknown as { errorName?: string; name: string };
    errorClassByName.set(ctor.errorName ?? ctor.name, value as new (message?: string) => Error);
  }
}

const fromErrorRaw = (raw: string): Error => {
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(raw);
  } catch {
    return new Error("unknown reason");
  }
  const name = typeof obj.name === "string" ? obj.name : undefined;
  const message = typeof obj.message === "string" ? obj.message : undefined;
  const Ctor = name ? errorClassByName.get(name) : undefined;
  const error = Ctor ? new Ctor(message) : new Error(message ?? "unknown reason");
  for (const key of Object.keys(obj)) {
    if (key === "stack") continue;
    try {
      (error as unknown as Record<string, unknown>)[key] = obj[key];
    } catch {
      // some properties (e.g. name) can be read-only; ignore
    }
  }
  return error;
};

export const toErrorRaw = (raw: Error): string =>
  JSON.stringify({ ...raw, name: raw.name, message: raw.message, stack: raw.stack });

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

// @flow

import mapValues from "lodash/mapValues";
import { BigNumber } from "bignumber.js";
import { deserializeError, serializeError } from "@ledgerhq/errors";
import type {
  TransactionStatusRaw,
  TransactionStatus,
} from "../types/transaction";

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

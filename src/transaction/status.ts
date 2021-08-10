import mapValues from "lodash/mapValues";
import { BigNumber } from "bignumber.js";
import { deserializeError, serializeError } from "@ledgerhq/errors";
import type {
  TransactionStatusRaw,
  TransactionStatus,
} from "../types/transaction";
import type { Account, Transaction } from "../types";
import { getAccountUnit } from "../account";
import {
  fromBitcoinInputRaw,
  fromBitcoinOutputRaw,
  toBitcoinInputRaw,
  toBitcoinOutputRaw,
} from "../families/bitcoin/serialization";
import { formatCurrencyUnit } from "../currencies";
import { formatOutput, formatInput } from "../families/bitcoin/account";
import { getEnv } from "../env";

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
  estimatedFees: new BigNumber(ts.estimatedFees),
  amount: new BigNumber(ts.amount),
  totalSpent: new BigNumber(ts.totalSpent),
  recipientIsReadOnly: ts.recipientIsReadOnly,
  txInputs: ts.txInputs ? ts.txInputs.map(fromBitcoinInputRaw) : undefined,
  txOutputs: ts.txOutputs ? ts.txOutputs.map(fromBitcoinOutputRaw) : undefined,
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
  txInputs: ts.txInputs ? ts.txInputs.map(toBitcoinInputRaw) : undefined,
  txOutputs: ts.txOutputs ? ts.txOutputs.map(toBitcoinOutputRaw) : undefined,
});

const formatErrorSmall = (e: Error): string =>
  e.name === "Error" ? e.message : e.name;

export const formatTransactionStatus = (
  t: Transaction,
  {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
    txInputs,
    txOutputs,
  }: TransactionStatus,
  mainAccount: Account
): string => {
  let str = "";
  const account =
    (t.subAccountId &&
      (mainAccount.subAccounts || []).find((a) => a.id === t.subAccountId)) ||
    mainAccount;

  if (txInputs) {
    const n = getEnv("DEBUG_UTXO_DISPLAY");
    const displayAll = txInputs.length <= n;
    str +=
      `\nTX INPUTS (${txInputs.length}):\n` +
      txInputs
        .slice(0, displayAll ? txInputs.length : n)
        .map((o) => formatInput(mainAccount, o))
        .join("\n");

    if (!displayAll) {
      str += "\n...";
    }
  }

  if (txOutputs) {
    str +=
      `\nTX OUTPUTS (${txOutputs.length}):\n` +
      txOutputs.map((o) => formatOutput(mainAccount, o)).join("\n");
  }

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

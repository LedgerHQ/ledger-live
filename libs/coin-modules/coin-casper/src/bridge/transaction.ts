import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/index";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/index";
import { formatTransactionStatus } from "@ledgerhq/ledger-wallet-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/ledger-wallet-framework/serialization";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { Transaction, TransactionRaw } from "../types";

export const formatTransaction = (
  { recipient, useAllAmount, amount }: Transaction,
  account: Account,
): string => `
SEND ${
  useAllAmount
    ? "MAX"
    : amount.isZero()
      ? ""
      : " " +
        formatCurrencyUnit(getAccountCurrency(account).units[0], amount, {
          showCode: true,
          disableRounding: true,
        })
}
TO ${recipient}`;

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);

  // Back-compat: legacy payloads may carry only `transferId`; normalize to memoValue.
  const memoValue = tr.memoValue ?? tr.transferId ?? null;

  return {
    ...common,
    family: tr.family,
    fees: new BigNumber(tr.fees),
    amount: new BigNumber(tr.amount),
    memoType: memoValue !== null ? "transferId" : (tr.memoType ?? null),
    memoValue,
  };
};

const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);

  // Back-compat: callers that set only `transferId` still serialize correctly.
  const memoValue: string | null = t.memoValue ?? t.transferId ?? null;
  const memoType: string | null = memoValue !== null ? "transferId" : (t.memoType ?? null);

  return {
    ...common,
    family: t.family,
    amount: t.amount.toFixed(),
    fees: t.fees.toString(),
    memoType,
    memoValue,
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

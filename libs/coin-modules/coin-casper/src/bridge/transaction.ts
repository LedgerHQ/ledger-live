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
  return {
    ...common,
    family: tr.family,
    fees: tr.fees ? new BigNumber(tr.fees) : null,
    amount: new BigNumber(tr.amount),
    ...(tr.transferId !== undefined
      ? { transferId: tr.transferId }
      : tr.memoType === "transferId" && typeof tr.memoValue === "string"
        ? { transferId: tr.memoValue }
        : {}),
    ...(tr.memoType !== undefined && { memoType: tr.memoType }),
    ...(tr.memoValue !== undefined && { memoValue: tr.memoValue }),
    ...(tr.mode !== undefined && { mode: tr.mode }),
    ...(tr.nonce !== undefined && tr.nonce !== null && { nonce: new BigNumber(tr.nonce) }),
  };
};

const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);

  return {
    ...common,
    family: t.family,
    amount: t.amount.toFixed(),
    fees: t.fees ? t.fees.toString() : null,
    ...(t.transferId !== undefined && { transferId: t.transferId }),
    ...(t.memoType !== undefined && { memoType: t.memoType }),
    ...(t.memoValue !== undefined && { memoValue: t.memoValue }),
    ...(t.mode !== undefined && { mode: t.mode }),
    ...(t.nonce !== undefined && t.nonce !== null && { nonce: t.nonce.toFixed() }),
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

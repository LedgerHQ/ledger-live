import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account";
import { formatTransactionStatus } from "@ledgerhq/ledger-wallet-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/ledger-wallet-framework/serialization";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getTransactionMemo, getTransactionStakeAccount } from "./transactions";
import type { Transaction, TransactionRaw } from "./types";

/**
 * `transferFee`, `stakeAccountRent` and `raw` are deliberately absent from the raw shape: the first
 * two are re-derived by every estimation, the third belongs to the swap flow that built it.
 */
export const fromTransactionRaw = (tr: TransactionRaw): Transaction => ({
  ...fromTransactionCommonRaw(tr),
  family: tr.family,
  ...(tr.mode ? { mode: tr.mode } : {}),
  ...(tr.memoType ? { memoType: tr.memoType } : {}),
  ...(tr.memoValue ? { memoValue: tr.memoValue } : {}),
});

export const toTransactionRaw = (t: Transaction): TransactionRaw => ({
  ...toTransactionCommonRaw(t),
  family: t.family,
  ...(t.mode ? { mode: t.mode } : {}),
  ...(t.memoType ? { memoType: t.memoType } : {}),
  ...(t.memoValue ? { memoValue: t.memoValue } : {}),
});

const formatAmount = (t: Transaction, account: AccountLike): string => {
  if (t.useAllAmount) return "MAX";
  if (t.amount.isZero()) return "";
  return formatCurrencyUnit(getAccountCurrency(account).units[0], t.amount, {
    showCode: true,
    disableRounding: true,
  });
};

/**
 * One line for the transaction-summary log. It runs on every signing inside a template string, so
 * it must never throw and must stay synchronous -- otherwise the line reads `[object Promise]`.
 */
export const formatTransaction = (t: Transaction, mainAccount: Account): string => {
  const account =
    (t.subAccountId && (mainAccount.subAccounts || []).find(a => a.id === t.subAccountId)) ||
    mainAccount;
  // Delegating carries the stake account in the memo, so read the user memo through the accessor
  // that filters on the memo type rather than off the field.
  const memo = getTransactionMemo(t);
  const stakeAccount = getTransactionStakeAccount(t);

  return `
${(t.mode ?? "send").toUpperCase()} ${formatAmount(t, account)}
TO ${t.recipient}${stakeAccount ? `\nSTAKE ACCOUNT ${stakeAccount}` : ""}${
    memo ? `\nMEMO ${memo}` : ""
  }`;
};

export default {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
  formatTransactionStatus,
};

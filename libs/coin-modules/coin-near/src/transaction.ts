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
import { BigNumber } from "bignumber.js";
import type { Transaction, TransactionRaw } from "./types";

export const formatTransaction = (
  { mode, amount, recipient, useAllAmount }: Transaction,
  account: Account,
): string => `
${mode.toUpperCase()} ${
  useAllAmount
    ? "MAX"
    : amount.isZero()
      ? ""
      : " " +
        formatCurrencyUnit(getAccountCurrency(account).units[0], amount, {
          showCode: true,
          disableRounding: true,
        })
}${recipient ? `\nTO ${recipient}` : ""}`;

// `fees` and `nonce` round-trip verbatim, including the `null` the generic-coin-framework's
// `createTransaction` starts them at. Coercing an unestimated fee to zero, or dropping the nonce,
// makes `fromTransactionRaw(toTransactionRaw(t))` differ from `t` — and a lost nonce sends
// `signOperation` into `getNextSequence`, which this module does not implement. Same shape as the
// other generic-route families (tezos, xrp).
export const fromTransactionRaw = (transactionRaw: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(transactionRaw);
  return {
    ...common,
    family: transactionRaw.family,
    mode: transactionRaw.mode,
    fees: transactionRaw.fees ? new BigNumber(transactionRaw.fees) : null,
    ...(transactionRaw.nonce != null && { nonce: new BigNumber(transactionRaw.nonce) }),
  };
};

export const toTransactionRaw = (transaction: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(transaction);
  const transactionRaw: TransactionRaw = {
    ...common,
    family: transaction.family,
    mode: transaction.mode,
    fees: transaction.fees ? transaction.fees.toString() : null,
    ...(transaction.nonce != null && { nonce: transaction.nonce.toString() }),
  };

  return transactionRaw;
};

export default {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
  formatTransactionStatus,
};

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
import type { Transaction, TransactionRaw } from "./types";

export function formatTransaction(transaction: Transaction, account: Account): string {
  const amount = formatCurrencyUnit(getAccountCurrency(account).units[0], transaction.amount, {
    showCode: true,
    disableRounding: true,
  });
  return `${transaction.mode.toUpperCase()} ${amount}\nTO ${transaction.recipient}`;
}

export function fromTransactionRaw(tr: TransactionRaw): Transaction {
  const common = fromTransactionCommonRaw(tr);
  return {
    ...common,
    family: tr.family,
    mode: tr.mode,
    fees: tr.fees ? new BigNumber(tr.fees) : null,
    assetReference: tr.assetReference,
    assetOwner: tr.assetOwner,
    valId: tr.valId,
    memoType: tr.memoType,
    memoValue: tr.memoValue,
    // Omit, not `null`: `fromTransactionRaw(toTransactionRaw(t))` must deep-equal `t`.
    ...(tr.gasLimit ? { gasLimit: new BigNumber(tr.gasLimit) } : {}),
    nonce: tr.nonce ? new BigNumber(tr.nonce) : new BigNumber(0),
  };
}

export function toTransactionRaw(t: Transaction): TransactionRaw {
  const common = toTransactionCommonRaw(t);
  return {
    ...common,
    family: t.family,
    mode: t.mode,
    fees: t.fees ? t.fees.toString() : null,
    assetReference: t.assetReference,
    assetOwner: t.assetOwner,
    valId: t.valId,
    memoType: t.memoType,
    memoValue: t.memoValue,
    ...(t.gasLimit ? { gasLimit: t.gasLimit.toString() } : {}),
    nonce: t.nonce ? t.nonce.toString() : null,
  };
}

export default {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
  formatTransactionStatus,
};

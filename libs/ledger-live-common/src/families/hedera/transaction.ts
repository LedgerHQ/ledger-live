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
import type { HederaGenericTransaction, HederaGenericTransactionRaw } from "./types";

/* istanbul ignore next: don't test CLI text helpers */
export function formatTransaction(transaction: HederaGenericTransaction, account: Account): string {
  const amount = formatCurrencyUnit(getAccountCurrency(account).units[0], transaction.amount, {
    showCode: true,
    disableRounding: true,
  });
  return `${transaction.mode.toUpperCase()} ${amount}${transaction.recipient ? `\nTO ${transaction.recipient}` : ""}`;
}

export function fromTransactionRaw(tr: HederaGenericTransactionRaw): HederaGenericTransaction {
  return {
    ...fromTransactionCommonRaw(tr),
    family: tr.family,
    mode: tr.mode,
    fees: tr.fees ? new BigNumber(tr.fees) : null,
    assetReference: tr.assetReference,
    assetOwner: tr.assetOwner,
    valId: tr.valId,
  };
}

export function toTransactionRaw(t: HederaGenericTransaction): HederaGenericTransactionRaw {
  return {
    ...toTransactionCommonRaw(t),
    family: t.family,
    mode: t.mode,
    fees: t.fees ? t.fees.toString() : null,
    assetReference: t.assetReference,
    assetOwner: t.assetOwner,
    valId: t.valId,
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

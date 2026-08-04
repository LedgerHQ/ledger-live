import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/index";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/index";
import { formatTransactionStatus } from "@ledgerhq/ledger-wallet-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/ledger-wallet-framework/serialization/transaction";
import type { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { Transaction, TransactionRaw } from "../types/bridge";

export const formatTransaction = (
  { amount, recipient, transferType, useAllAmount }: Transaction,
  account: Account,
): string => `
SEND ${
  useAllAmount
    ? "MAX"
    : formatCurrencyUnit(getAccountCurrency(account).units[0], amount, {
        showCode: true,
        disableRounding: true,
      })
}
TO ${recipient}
(${transferType})`;

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  return {
    ...common,
    family: tr.family,
    transferType: tr.transferType,
    ...(tr.sender !== undefined && { sender: tr.sender }),
    ...(tr.recipientType !== undefined && { recipientType: tr.recipientType }),
    ...(tr.memo !== undefined && { memo: tr.memo }),
    ...(tr.zcashFee !== undefined && { zcashFee: new BigNumber(tr.zcashFee) }),
    ...(tr.changeAmount !== undefined && { changeAmount: new BigNumber(tr.changeAmount) }),
  };
};

export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  return {
    ...common,
    family: t.family,
    transferType: t.transferType,
    ...(t.sender !== undefined && { sender: t.sender }),
    ...(t.recipientType !== undefined && { recipientType: t.recipientType }),
    ...(t.memo !== undefined && { memo: t.memo }),
    ...(t.zcashFee !== undefined && { zcashFee: t.zcashFee.toString() }),
    ...(t.changeAmount !== undefined && { changeAmount: t.changeAmount.toString() }),
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

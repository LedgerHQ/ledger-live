import { BigNumber } from "bignumber.js";
import type { Transaction, TransactionRaw } from "../types";
import { formatTransactionStatus } from "@ledgerhq/coin-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/coin-framework/serialization/transaction";
import type { Account } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/coin-framework/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";

export const formatTransaction = (
  { amount, recipient, fee, useAllAmount }: Transaction,
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
with fee=${
  !fee
    ? "?"
    : formatCurrencyUnit(getAccountCurrency(account).units[0], fee, {
        showCode: true,
        disableRounding: true,
      })
}`;

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  return {
    ...common,
    family: tr.family,
    fee: tr.fee ? new BigNumber(tr.fee) : null,
  };
};

export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  return {
    ...common,
    family: t.family,
    fee: t.fee ? t.fee.toString() : null,
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

import BigNumber from "bignumber.js";
import { formatTransactionStatus } from "@ledgerhq/coin-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/coin-framework/serialization";
import type { Account } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/coin-framework/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import type { Transaction, TransactionRaw } from "../types";
import { TRANSACTION_TYPE } from "../constants";

export function formatTransaction(transaction: Transaction, account: Account): string {
  const amount = formatCurrencyUnit(getAccountCurrency(account).units[0], transaction.amount, {
    showCode: true,
    disableRounding: true,
  });

  return `SEND ${amount}\nTO ${transaction.recipient}`;
}

export function fromTransactionRaw(tr: TransactionRaw): Transaction {
  const commonGeneric = fromTransactionCommonRaw(tr);
  const commonAleo = {
    family: tr.family,
    fees: new BigNumber(tr.fees),
  };

  if (
    tr.type === TRANSACTION_TYPE.TRANSFER_PRIVATE ||
    tr.type === TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC
  ) {
    return {
      ...commonGeneric,
      ...commonAleo,
      type: tr.type,
      amountRecord: tr.amountRecord,
      feeRecord: tr.feeRecord,
    };
  }

  return {
    ...commonGeneric,
    ...commonAleo,
    type: tr.type,
  };
}

export function toTransactionRaw(t: Transaction): TransactionRaw {
  const commonGeneric = toTransactionCommonRaw(t);
  const commonAleo = {
    family: t.family,
    fees: t.fees.toString(),
  };

  if (
    t.type === TRANSACTION_TYPE.TRANSFER_PRIVATE ||
    t.type === TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC
  ) {
    return {
      ...commonGeneric,
      ...commonAleo,
      type: t.type,
      amountRecord: t.amountRecord,
      feeRecord: t.feeRecord,
    };
  }

  return {
    ...commonGeneric,
    ...commonAleo,
    type: t.type,
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

import BigNumber from "bignumber.js";
import { formatTransactionStatus } from "@ledgerhq/ledger-wallet-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/ledger-wallet-framework/serialization";
import type { Account } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/index";
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
  const common = fromTransactionCommonRaw(tr);

  if (
    tr.mode === TRANSACTION_TYPE.TRANSFER_PRIVATE ||
    tr.mode === TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC
  ) {
    return {
      ...common,
      family: tr.family,
      mode: tr.mode,
      fees: new BigNumber(tr.fees),
      ...(tr.properties
        ? {
            properties: {
              amountRecord: tr.properties.amountRecord
                ? JSON.parse(tr.properties.amountRecord)
                : null,
              feeRecord: tr.properties.feeRecord ? JSON.parse(tr.properties.feeRecord) : null,
            },
          }
        : {}),
    };
  }

  return {
    ...common,
    family: tr.family,
    mode: tr.mode,
    fees: new BigNumber(tr.fees),
  };
}

export function toTransactionRaw(t: Transaction): TransactionRaw {
  const common = toTransactionCommonRaw(t);

  if (
    t.mode === TRANSACTION_TYPE.TRANSFER_PRIVATE ||
    t.mode === TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC
  ) {
    return {
      ...common,
      family: t.family,
      mode: t.mode,
      fees: t.fees.toString(),
      ...(t.properties
        ? {
            properties: {
              amountRecord: t.properties.amountRecord
                ? JSON.stringify(t.properties.amountRecord)
                : null,
              feeRecord: t.properties.feeRecord ? JSON.stringify(t.properties.feeRecord) : null,
            },
          }
        : {}),
    };
  }

  return {
    ...common,
    family: t.family,
    mode: t.mode,
    fees: t.fees.toString(),
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

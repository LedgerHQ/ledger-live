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
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/index";
import { isPrivateTransaction } from "../logic/utils";
import { TRANSACTION_TYPE } from "../constants";
import type { Transaction, TransactionRaw } from "../types";

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
    tr.mode === TRANSACTION_TYPE.TRANSFER_PRIVATE ||
    tr.mode === TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC ||
    tr.mode === TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE ||
    tr.mode === TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC
  ) {
    return {
      ...commonGeneric,
      ...commonAleo,
      mode: tr.mode,
      properties: tr.properties,
    };
  }

  return {
    ...commonGeneric,
    ...commonAleo,
    mode: tr.mode,
  };
}

export function toTransactionRaw(t: Transaction): TransactionRaw {
  const commonGeneric = toTransactionCommonRaw(t);
  const commonAleo = {
    family: t.family,
    fees: t.fees.toString(),
  };

  if (isPrivateTransaction(t)) {
    return {
      ...commonGeneric,
      ...commonAleo,
      mode: t.mode,
      properties: t.properties,
    };
  }

  return {
    ...commonGeneric,
    ...commonAleo,
    mode: t.mode,
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

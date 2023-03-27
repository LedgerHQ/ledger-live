import type { Transaction, TransactionRaw } from "./types";
import {
  formatTransactionStatusCommon as formatTransactionStatus,
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/coin-framework/transaction/common";
import type { Account } from "@ledgerhq/types-live";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import { BN } from "@zilliqa-js/util";

export const formatTransaction = (t: Transaction, account: Account): string => {
  return `SEND ${formatCurrencyUnit(getAccountUnit(account), t.amount, {
    showCode: true,
    disableRounding: true,
  })}
TO ${t.recipient}`;
};

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  let gasPrice: BN | undefined = undefined;
  let gasLimit: BN | undefined = undefined;
  if (tr.gasPrice) {
    gasPrice = new BN(tr.gasPrice);
  }
  if (tr.gasLimit) {
    gasLimit = new BN(tr.gasLimit);
  }
  return {
    ...common,
    family: tr.family,
    gasPrice,
    gasLimit,
  };
};

export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  let gasPrice: string | undefined = undefined;
  let gasLimit: string | undefined = undefined;
  if (t.gasPrice) {
    gasPrice = t.gasPrice.toString();
  }
  if (t.gasLimit) {
    gasLimit = t.gasLimit.toString();
  }
  return {
    ...common,
    family: t.family,
    gasPrice,
    gasLimit,
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

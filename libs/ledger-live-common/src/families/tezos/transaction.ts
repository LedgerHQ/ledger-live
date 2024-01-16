import { BigNumber } from "bignumber.js";
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

export const formatTransaction = (
  {
    mode,
    subAccountId,
    amount,
    recipient,
    gasLimit,
    storageLimit,
    fees,
    useAllAmount,
    estimatedFees,
  }: Transaction,
  mainAccount: Account,
): string => {
  const account =
    (subAccountId && (mainAccount.subAccounts || []).find(a => a.id === subAccountId)) ||
    mainAccount;
  return `
${mode.toUpperCase()} ${
    useAllAmount
      ? "MAX"
      : formatCurrencyUnit(getAccountUnit(account), amount, {
          showCode: true,
          disableRounding: true,
        })
  }
TO ${recipient}
with fees=${!fees ? "?" : formatCurrencyUnit(mainAccount.unit, fees)}
with gasLimit=${!gasLimit ? "?" : gasLimit.toString()}
with storageLimit=${!storageLimit ? "?" : storageLimit.toString()}
(estimatedFees ${!estimatedFees ? "?" : formatCurrencyUnit(mainAccount.unit, estimatedFees)})`;
};

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  const { networkInfo } = tr;
  return {
    ...common,
    family: tr.family,
    mode: tr.mode,
    networkInfo: networkInfo && {
      family: networkInfo.family,
      fees: new BigNumber(networkInfo.fees),
    },
    fees: tr.fees ? new BigNumber(tr.fees) : null,
    gasLimit: tr.gasLimit ? new BigNumber(tr.gasLimit) : null,
    storageLimit: tr.storageLimit ? new BigNumber(tr.storageLimit) : null,
    estimatedFees: tr.estimatedFees ? new BigNumber(tr.estimatedFees) : null,
    taquitoError: tr.taquitoError,
  };
};

export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  const { networkInfo } = t;
  return {
    ...common,
    family: t.family,
    mode: t.mode,
    networkInfo: networkInfo && {
      family: networkInfo.family,
      fees: networkInfo.fees.toString(),
    },
    fees: t.fees ? t.fees.toString() : null,
    gasLimit: t.gasLimit ? t.gasLimit.toString() : null,
    storageLimit: t.storageLimit ? t.storageLimit.toString() : null,
    estimatedFees: t.estimatedFees ? t.estimatedFees.toString() : null,
    taquitoError: t.taquitoError,
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

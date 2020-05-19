// @flow
import { BigNumber } from "bignumber.js";
import type { Transaction, TransactionRaw } from "./types";
import {
  fromTransactionCommonRaw,
  toTransactionCommonRaw,
} from "../../transaction/common";
import type { Account } from "../../types";
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
  }: Transaction,
  mainAccount: Account
): string => {
  const account =
    (subAccountId &&
      (mainAccount.subAccounts || []).find((a) => a.id === subAccountId)) ||
    mainAccount;
  return `
  ${mode.toUpperCase()} ${formatCurrencyUnit(getAccountUnit(account), amount, {
    showCode: true,
    disableRounding: true,
  })}
  TO ${recipient}
  with fees=${!fees ? "?" : formatCurrencyUnit(mainAccount.unit, fees)}
  with gasLimit=${!gasLimit ? "?" : gasLimit.toString()}
  with storageLimit=${!storageLimit ? "?" : storageLimit.toString()}`;
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
      fees: BigNumber(networkInfo.fees),
    },
    fees: tr.fees ? BigNumber(tr.fees) : null,
    gasLimit: tr.gasLimit ? BigNumber(tr.gasLimit) : null,
    storageLimit: tr.storageLimit ? BigNumber(tr.storageLimit) : null,
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
  };
};

export default { formatTransaction, fromTransactionRaw, toTransactionRaw };

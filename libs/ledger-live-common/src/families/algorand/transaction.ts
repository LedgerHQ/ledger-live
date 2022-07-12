import { BigNumber } from "bignumber.js";
import type {
  AlgorandAccount,
  AlgorandTransaction,
  AlgorandTransactionRaw,
} from "./types";
import {
  formatTransactionStatusCommon as formatTransactionStatus,
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "../../transaction/common";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
export const formatTransaction = (
  {
    mode,
    subAccountId,
    amount,
    recipient,
    fees,
    useAllAmount,
  }: AlgorandTransaction,
  mainAccount: AlgorandAccount
): string => {
  const account =
    (subAccountId &&
      (mainAccount.subAccounts || []).find((a) => a.id === subAccountId)) ||
    mainAccount;
  return `
    ${
      mode === "claimReward"
        ? "CLAIM REWARD"
        : mode === "optIn"
        ? "OPT_IN"
        : "SEND"
    } ${
    useAllAmount
      ? "MAX"
      : formatCurrencyUnit(getAccountUnit(account), amount, {
          showCode: true,
          disableRounding: false,
        })
  }
    TO ${recipient}
    with fees=${
      !fees
        ? "?"
        : formatCurrencyUnit(getAccountUnit(mainAccount), fees, {
            showCode: true,
            disableRounding: false,
          })
    }`;
};

const fromTransactionRaw = (
  tr: AlgorandTransactionRaw
): AlgorandTransaction => {
  const common = fromTransactionCommonRaw(tr);
  return {
    ...common,
    family: tr.family,
    fees: tr.fees ? new BigNumber(tr.fees) : null,
    memo: tr.memo,
    mode: tr.mode,
    assetId: tr.assetId,
  };
};

const toTransactionRaw = (t: AlgorandTransaction): AlgorandTransactionRaw => {
  const common = toTransactionCommonRaw(t);
  return {
    ...common,
    family: t.family,
    fees: t.fees ? t.fees.toString() : null,
    memo: t.memo,
    mode: t.mode,
    assetId: t.assetId,
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

import { BigNumber } from "bignumber.js";
import type { Transaction, TransactionRaw } from "./types";
import { getAssetCodeIssuer } from "./logic";
import { formatTransactionStatus } from "@ledgerhq/coin-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/coin-framework/serialization";
import type { Account } from "@ledgerhq/types-live";
import { getAccountCurrency } from "../../account";
import { formatCurrencyUnit } from "../../currencies";

export const formatTransaction = (
  { amount, recipient, fees, memoValue, useAllAmount, subAccountId }: Transaction,
  mainAccount: Account,
): string => {
  const account =
    (subAccountId && (mainAccount.subAccounts || []).find(a => a.id === subAccountId)) ||
    mainAccount;

  return `
    SEND ${
      useAllAmount
        ? "MAX"
        : formatCurrencyUnit(getAccountCurrency(account).units[0], amount, {
            showCode: true,
            disableRounding: true,
          })
    }
    TO ${recipient}
    with fees=${
      !fees
        ? "?"
        : formatCurrencyUnit(getAccountCurrency(account).units[0], fees, {
            showCode: true,
            disableRounding: true,
          })
    }${memoValue ? "\n  memo=" + memoValue : ""}`;
};

const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  const { networkInfo } = tr;
  const [assetCode, assetIssuer] = getAssetCodeIssuer(tr);

  return {
    ...common,
    family: tr.family,
    fees: tr.fees ? new BigNumber(tr.fees) : null,
    baseReserve: tr.baseReserve ? new BigNumber(tr.baseReserve) : null,
    memoValue: tr.memoValue ? tr.memoValue : null,
    memoType: tr.memoType ? tr.memoType : null,
    networkInfo: networkInfo && {
      family: networkInfo.family,
      fees: new BigNumber(networkInfo.fees),
      baseFee: new BigNumber(networkInfo.baseFee),
      baseReserve: new BigNumber(networkInfo.baseReserve),
      networkCongestionLevel: networkInfo.networkCongestionLevel,
    },
    mode: tr.mode,
    assetCode,
    assetIssuer,
  };
};

const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  const { networkInfo } = t;
  const [assetCode, assetIssuer] = getAssetCodeIssuer(t);
  return {
    ...common,
    family: t.family,
    fees: t.fees ? t.fees.toString() : null,
    baseReserve: t.baseReserve ? t.baseReserve.toString() : null,
    memoValue: t.memoValue ? t.memoValue.toString() : null,
    memoType: t.memoType ? t.memoType.toString() : null,
    networkInfo: networkInfo && {
      family: networkInfo.family,
      fees: networkInfo.fees.toString(),
      baseFee: networkInfo.baseFee.toString(),
      baseReserve: networkInfo.baseReserve.toString(),
      networkCongestionLevel: networkInfo.networkCongestionLevel,
    },
    mode: t.mode,
    assetCode,
    assetIssuer,
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

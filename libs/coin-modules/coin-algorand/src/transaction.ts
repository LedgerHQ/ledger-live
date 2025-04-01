import { getAccountCurrency } from "@ledgerhq/coin-framework/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { formatTransactionStatus } from "@ledgerhq/coin-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/coin-framework/serialization";
import { type Account, SerializationTransactionBridge } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { AlgorandTransaction, AlgorandTransactionRaw } from "./types";

type AlgorandSerializationTransactionBridge = SerializationTransactionBridge<
  AlgorandTransaction,
  AlgorandTransactionRaw
>;

const formatTransaction = (
  { mode, subAccountId, amount, recipient, fees, useAllAmount }: AlgorandTransaction,
  mainAccount: Account,
): string => {
  const account =
    (subAccountId && (mainAccount.subAccounts || []).find(a => a.id === subAccountId)) ||
    mainAccount;
  return `
    ${mode === "claimReward" ? "CLAIM REWARD" : mode === "optIn" ? "OPT_IN" : "SEND"} ${
      useAllAmount
        ? "MAX"
        : formatCurrencyUnit(getAccountCurrency(account).units[0], amount, {
            showCode: true,
            disableRounding: false,
          })
    }
    TO ${recipient}
    with fees=${
      !fees
        ? "?"
        : formatCurrencyUnit(mainAccount.currency.units[0], fees, {
            showCode: true,
            disableRounding: false,
          })
    }`;
};

const fromTransactionRaw = (tr: AlgorandTransactionRaw): AlgorandTransaction => {
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

export const serialization = {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
  formatTransactionStatus,
} satisfies AlgorandSerializationTransactionBridge;

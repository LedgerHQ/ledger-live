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

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  const { networkInfo } = tr;
  return {
    ...common,
    networkInfo: networkInfo && {
      family: "tron",
      freeNetUsed: BigNumber(networkInfo.freeNetUsed),
      freeNetLimit: BigNumber(networkInfo.freeNetLimit),
      netUsed: BigNumber(networkInfo.netUsed),
      netLimit: BigNumber(networkInfo.netLimit),
      energyUsed: BigNumber(networkInfo.energyUsed),
      energyLimit: BigNumber(networkInfo.energyLimit),
    },
    family: tr.family,
    mode: tr.mode,
    resource: tr.resource || null,
    duration: tr.duration || 3,
    votes: tr.votes,
  };
};

export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  const { networkInfo } = t;
  return {
    ...common,
    networkInfo: networkInfo && {
      family: "tron",
      freeNetUsed: networkInfo.freeNetUsed.toString(),
      freeNetLimit: networkInfo.freeNetLimit.toString(),
      netUsed: networkInfo.netUsed.toString(),
      netLimit: networkInfo.netLimit.toString(),
      energyUsed: networkInfo.energyUsed.toString(),
      energyLimit: networkInfo.energyLimit.toString(),
    },
    family: t.family,
    mode: t.mode,
    resource: t.resource || null,
    duration: t.duration || 3,
    votes: t.votes,
  };
};

export const formatTransaction = (
  t: Transaction,
  mainAccount: Account
): string => {
  const account =
    (t.subAccountId &&
      (mainAccount.subAccounts || []).find((a) => a.id === t.subAccountId)) ||
    mainAccount;
  return `
  ${t.mode.toUpperCase()}${t.resource ? " " + t.resource : ""} ${
    t.useAllAmount
      ? "MAX"
      : t.amount.isZero()
      ? ""
      : " " +
        formatCurrencyUnit(getAccountUnit(account), t.amount, {
          showCode: true,
          disableRounding: true,
        })
  }${
    !t.votes
      ? ""
      : " " + t.votes.map((v) => v.voteCount + "->" + v.address).join(" ")
  }
  TO ${t.recipient}`;
};

export default { formatTransaction, fromTransactionRaw, toTransactionRaw };

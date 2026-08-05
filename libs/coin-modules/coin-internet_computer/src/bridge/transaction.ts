import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/index";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/index";
import { formatTransactionStatus } from "@ledgerhq/ledger-wallet-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/ledger-wallet-framework/serialization";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { Transaction, TransactionRaw } from "../types";

export const formatTransaction = (
  { recipient, useAllAmount, amount }: Transaction,
  account: Account,
): string => `
SEND ${
  useAllAmount
    ? "MAX"
    : amount.isZero()
      ? ""
      : " " +
        formatCurrencyUnit(getAccountCurrency(account).units[0], amount, {
          showCode: true,
          disableRounding: true,
        })
}
TO ${recipient}`;

// ICP-specific transaction fields carried verbatim through (de)serialization (all JSON-native).
// Undefined fields are omitted (not set to undefined) to satisfy exactOptionalPropertyTypes.
const icpFields = (t: Transaction | TransactionRaw) => ({
  // Default the type for TransactionRaw persisted before neuron staking (pre-`type`), so a plain
  // transfer never deserializes to `undefined` and mis-routes as a governance op.
  type: t.type ?? "send",
  ...(t.neuronId !== undefined && { neuronId: t.neuronId }),
  ...(t.stakeNonce !== undefined && { stakeNonce: t.stakeNonce }),
  ...(t.percentageToStake !== undefined && { percentageToStake: t.percentageToStake }),
  ...(t.percentageToSpawn !== undefined && { percentageToSpawn: t.percentageToSpawn }),
  ...(t.dissolveDelay !== undefined && { dissolveDelay: t.dissolveDelay }),
  ...(t.additionalDissolveDelay !== undefined && {
    additionalDissolveDelay: t.additionalDissolveDelay,
  }),
  ...(t.autoStakeMaturity !== undefined && { autoStakeMaturity: t.autoStakeMaturity }),
  ...(t.hotKeyToRemove !== undefined && { hotKeyToRemove: t.hotKeyToRemove }),
  ...(t.hotKeyToAdd !== undefined && { hotKeyToAdd: t.hotKeyToAdd }),
  ...(t.followTopic !== undefined && { followTopic: t.followTopic }),
  ...(t.followeesIds !== undefined && { followeesIds: t.followeesIds }),
});

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  return {
    ...common,
    ...icpFields(tr),
    family: tr.family,
    fees: new BigNumber(tr.fees),
    amount: new BigNumber(tr.amount),
    memo: tr.memo,
  };
};

const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);

  return {
    ...common,
    ...icpFields(t),
    family: t.family,
    amount: t.amount.toFixed(),
    fees: t.fees.toString(),
    memo: t.memo,
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

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
import type { AnchorMode } from "@stacks/transactions";
import BigNumber from "bignumber.js";
import { StacksNetwork } from "../network/api";

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

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);

  // validate if network is valid -- only the legacy bridge sets it; a generic-bridge transaction
  // carries neither `network` nor `anchorMode` (the generic path reads the configured network).
  if (tr.network !== undefined && !StacksNetwork[tr.network]) {
    throw new Error(`network ${tr.network} not valid`);
  }

  return {
    ...common,
    family: tr.family,
    nonce: tr.nonce !== undefined ? new BigNumber(tr.nonce) : undefined,
    fee: tr.fee !== undefined ? new BigNumber(tr.fee) : undefined,
    fees: tr.fees !== undefined && tr.fees !== null ? new BigNumber(tr.fees) : tr.fees,
    amount: new BigNumber(tr.amount),
    // Both stay undefined for a generic-bridge transaction, which never reads them.
    network: tr.network as keyof typeof StacksNetwork,
    anchorMode: tr.anchorMode as AnchorMode,
    memo: tr.memo,
    mode: tr.mode,
    valAddress: tr.valAddress,
    familySpecificData: tr.familySpecificData,
    ...(tr.assetReference !== undefined && { assetReference: tr.assetReference }),
    ...(tr.assetOwner !== undefined && { assetOwner: tr.assetOwner }),
  };
};

const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);

  return {
    ...common,
    family: t.family,
    fee: t.fee !== undefined ? t.fee.toFixed() : undefined,
    fees: t.fees !== undefined && t.fees !== null ? t.fees.toFixed() : t.fees,
    nonce: t.nonce !== undefined ? t.nonce.toFixed() : undefined,
    amount: t.amount.toFixed(),
    network: t.network,
    anchorMode: t.anchorMode,
    memo: t.memo,
    mode: t.mode,
    valAddress: t.valAddress,
    familySpecificData: t.familySpecificData,
    ...(t.assetReference !== undefined && { assetReference: t.assetReference }),
    ...(t.assetOwner !== undefined && { assetOwner: t.assetOwner }),
  };
};

export default {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
  formatTransactionStatus,
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
};

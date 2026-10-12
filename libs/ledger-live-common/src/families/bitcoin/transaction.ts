import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/index";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/index";
import { formatTransactionStatus as formatTransactionStatusCommon } from "@ledgerhq/ledger-wallet-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon,
} from "@ledgerhq/ledger-wallet-framework/serialization";
import type { Account } from "@ledgerhq/types-live";
import {
  bitcoinPickingStrategy,
  getFamilySpecificData,
  getFeeParameters,
  getUtxoStrategy,
  type Transaction,
  type TransactionRaw,
  type TransactionStatus,
  type TransactionStatusRaw,
} from "./types";

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => ({
  ...fromTransactionCommonRaw(tr),
  family: tr.family,
  ...(tr.mode ? { mode: tr.mode } : {}),
  fees: tr.fees ? new BigNumber(tr.fees) : null,
  ...(tr.nonce ? { nonce: new BigNumber(tr.nonce) } : {}),
  ...(tr.customFees
    ? {
        customFees: {
          parameters: {
            fees: tr.customFees.parameters.fees
              ? new BigNumber(tr.customFees.parameters.fees)
              : undefined,
          },
        },
      }
    : {}),
  ...(tr.familySpecificData ? { familySpecificData: tr.familySpecificData } : {}),
  feesStrategy: tr.feesStrategy,
});

// `feeParameters` is derived from the last estimation: persisting it is how a stale figure survives
export const toTransactionRaw = (t: Transaction): TransactionRaw => ({
  ...toTransactionCommonRaw(t),
  family: t.family,
  ...(t.mode ? { mode: t.mode } : {}),
  fees: t.fees ? t.fees.toFixed() : null,
  ...(t.nonce ? { nonce: t.nonce.toFixed() } : {}),
  ...(t.customFees
    ? { customFees: { parameters: { fees: t.customFees.parameters.fees?.toFixed() ?? null } } }
    : {}),
  ...(t.familySpecificData ? { familySpecificData: t.familySpecificData } : {}),
  feesStrategy: t.feesStrategy,
});

export const fromTransactionStatusRaw = (tr: TransactionStatusRaw): TransactionStatus =>
  fromTransactionStatusRawCommon(tr);

export const toTransactionStatusRaw = (t: TransactionStatus): TransactionStatusRaw =>
  toTransactionStatusRawCommon(t);

export const formatTransactionStatus = (
  t: Transaction,
  status: TransactionStatus,
  mainAccount: Account,
): string => {
  const unit = mainAccount.currency.units[0];
  const { inputs = [], outputs = [] } = getFeeParameters(t);
  const format = (value: string) =>
    formatCurrencyUnit(unit, new BigNumber(value), { showCode: false }).padEnd(12);
  return (
    `\nTX INPUTS (${inputs.length}):\n` +
    inputs.map(i => `${format(i.value)} ${i.address} ${i.txid}@${i.vout}`).join("\n") +
    `\nTX OUTPUTS (${outputs.length}):\n` +
    outputs
      .map(o => `${format(o.value)} ${o.address ?? "OP_RETURN"}${o.isChange ? " (change)" : ""}`)
      .join("\n") +
    formatTransactionStatusCommon(t, status, mainAccount)
  );
};

export const formatTransaction = (t: Transaction, account: Account): string => {
  const { feePerByte, feeRates } = getFeeParameters(t);
  const { strategy, excludeUTXOs } = getUtxoStrategy(t);
  const { replaceTxId } = getFamilySpecificData(t);
  return `
SEND ${
    t.useAllAmount
      ? "MAX"
      : formatCurrencyUnit(getAccountCurrency(account).units[0], t.amount, {
          showCode: true,
          disableRounding: true,
        })
  }
TO ${t.recipient}
with feePerByte=${feePerByte ?? "?"} (${
    feeRates
      ? `network fees: fast=${feeRates.fast}, medium=${feeRates.medium}, slow=${feeRates.slow}`
      : "network info not loaded"
  })
${[
  Object.keys(bitcoinPickingStrategy).find(
    k => bitcoinPickingStrategy[k as keyof typeof bitcoinPickingStrategy] === strategy,
  ),
  replaceTxId && `replacing ${replaceTxId}`,
]
  .filter(Boolean)
  .join(" ")}${excludeUTXOs.map(utxo => `\nexclude ${utxo.hash} @${utxo.outputIndex}`).join("")}`;
};

export default {
  fromTransactionRaw,
  toTransactionRaw,
  formatTransaction,
  formatTransactionStatus,
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
};

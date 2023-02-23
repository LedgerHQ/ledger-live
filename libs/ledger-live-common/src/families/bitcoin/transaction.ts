import { BigNumber } from "bignumber.js";
import type {
  Transaction,
  TransactionRaw,
  FeeItems,
  FeeItemsRaw,
  TransactionStatusRaw,
  TransactionStatus,
  BitcoinAccount,
} from "./types";
import { bitcoinPickingStrategy } from "./types";
import { getEnv } from "../../env";
import {
  formatTransactionStatusCommon,
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon,
} from "@ledgerhq/coin-framework/transaction/common";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import type { Account } from "@ledgerhq/types-live";
import {
  fromBitcoinInputRaw,
  fromBitcoinOutputRaw,
  toBitcoinInputRaw,
  toBitcoinOutputRaw,
} from "./serialization";
import { formatInput, formatOutput } from "./account";

const fromFeeItemsRaw = (fir: FeeItemsRaw): FeeItems => ({
  items: fir.items.map((fi) => ({
    key: fi.key,
    speed: fi.speed,
    feePerByte: new BigNumber(fi.feePerByte),
  })),
  defaultFeePerByte: new BigNumber(fir.defaultFeePerByte),
});

const toFeeItemsRaw = (fir: FeeItems): FeeItemsRaw => ({
  items: fir.items.map((fi) => ({
    key: fi.key,
    speed: fi.speed,
    feePerByte: fi.feePerByte.toString(),
  })),
  defaultFeePerByte: fir.defaultFeePerByte.toString(),
});

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  return {
    ...common,
    rbf: tr.rbf,
    utxoStrategy: tr.utxoStrategy,
    family: tr.family,
    feePerByte: tr.feePerByte ? new BigNumber(tr.feePerByte) : null,
    networkInfo: tr.networkInfo && {
      family: tr.networkInfo.family,
      feeItems: fromFeeItemsRaw(tr.networkInfo.feeItems),
    },
    feesStrategy: tr.feesStrategy,
    opReturnData: tr.opReturnData,
  };
};

export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  return {
    ...common,
    rbf: t.rbf,
    utxoStrategy: t.utxoStrategy,
    family: t.family,
    feePerByte: t.feePerByte ? t.feePerByte.toString() : null,
    networkInfo: t.networkInfo && {
      family: t.networkInfo.family,
      feeItems: toFeeItemsRaw(t.networkInfo.feeItems),
    },
    feesStrategy: t.feesStrategy,
    opReturnData: t.opReturnData,
  };
};

const fromTransactionStatusRaw = (
  tr: TransactionStatusRaw
): TransactionStatus => {
  const common = fromTransactionStatusRawCommon(tr);
  return {
    ...common,
    txInputs: tr.txInputs ? tr.txInputs.map(fromBitcoinInputRaw) : undefined,
    txOutputs: tr.txOutputs
      ? tr.txOutputs.map(fromBitcoinOutputRaw)
      : undefined,
    opReturnData: tr.opReturnData,
  };
};

const toTransactionStatusRaw = (t: TransactionStatus): TransactionStatusRaw => {
  const common = toTransactionStatusRawCommon(t);
  return {
    ...common,
    txInputs: t.txInputs ? t.txInputs.map(toBitcoinInputRaw) : undefined,
    txOutputs: t.txOutputs ? t.txOutputs.map(toBitcoinOutputRaw) : undefined,
    opReturnData: t.opReturnData,
  };
};

export const formatTransactionStatus = (
  t: Transaction,
  ts: TransactionStatus,
  mainAccount: Account
): string => {
  let str = "";
  const txInputs = ts.txInputs || [];
  const txOutputs = ts.txOutputs || [];
  const n = getEnv("DEBUG_UTXO_DISPLAY");
  const displayAll = txInputs.length <= n;
  str +=
    `\nTX INPUTS (${txInputs.length}):\n` +
    txInputs
      .slice(0, displayAll ? txInputs.length : n)
      .map((o) => formatInput(mainAccount as BitcoinAccount, o))
      .join("\n");

  if (!displayAll) {
    str += "\n...";
  }

  str +=
    `\nTX OUTPUTS (${txOutputs.length}):\n` +
    txOutputs
      .map((o) => formatOutput(mainAccount as BitcoinAccount, o))
      .join("\n");

  str += formatTransactionStatusCommon(t, ts, mainAccount);

  return str;
};

const formatNetworkInfo = (
  networkInfo:
    | {
        feeItems: FeeItems;
      }
    | null
    | undefined
) => {
  if (!networkInfo) return "network info not loaded";
  return `network fees: ${networkInfo.feeItems.items
    .map((i) => i.key + "=" + i.feePerByte.toString())
    .join(", ")}`;
};

export const formatTransaction = (t: Transaction, account: Account): string => {
  const n = getEnv("DEBUG_UTXO_DISPLAY");
  const { excludeUTXOs, strategy } = t.utxoStrategy;
  const displayAll = excludeUTXOs.length <= n;
  return `
SEND ${
    t.useAllAmount
      ? "MAX"
      : formatCurrencyUnit(getAccountUnit(account), t.amount, {
          showCode: true,
          disableRounding: true,
        })
  }
TO ${t.recipient}
with feePerByte=${
    t.feePerByte ? t.feePerByte.toString() : "?"
  } (${formatNetworkInfo(t.networkInfo)})
${[
  Object.keys(bitcoinPickingStrategy).find(
    (k) => bitcoinPickingStrategy[k] === strategy
  ),
  "pick-unconfirmed",
  t.rbf && "RBF-enabled",
]
  .filter(Boolean)
  .join(" ")}${excludeUTXOs
    .slice(0, displayAll ? excludeUTXOs.length : n)
    .map((utxo) => `\nexclude ${utxo.hash} @${utxo.outputIndex}`)
    .join("")}`;
};

export default {
  fromTransactionRaw,
  toTransactionRaw,
  formatTransaction,
  formatTransactionStatus,
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
};

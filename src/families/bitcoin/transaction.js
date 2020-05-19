// @flow
import { BigNumber } from "bignumber.js";
import type {
  Transaction,
  TransactionRaw,
  FeeItems,
  FeeItemsRaw,
} from "./types";
import type { Account } from "../../types";
import {
  fromTransactionCommonRaw,
  toTransactionCommonRaw,
} from "../../transaction/common";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";

const fromFeeItemsRaw = (fir: FeeItemsRaw): FeeItems => ({
  items: fir.items.map((fi) => ({
    key: fi.key,
    speed: fi.speed,
    feePerByte: BigNumber(fi.feePerByte),
  })),
  defaultFeePerByte: BigNumber(fir.defaultFeePerByte),
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
    family: tr.family,
    feePerByte: tr.feePerByte ? BigNumber(tr.feePerByte) : null,
    networkInfo: tr.networkInfo && {
      family: tr.networkInfo.family,
      feeItems: fromFeeItemsRaw(tr.networkInfo.feeItems),
    },
  };
};

export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  return {
    ...common,
    family: t.family,
    feePerByte: t.feePerByte ? t.feePerByte.toString() : null,
    networkInfo: t.networkInfo && {
      family: t.networkInfo.family,
      feeItems: toFeeItemsRaw(t.networkInfo.feeItems),
    },
  };
};

const formatNetworkInfo = (networkInfo: ?{ feeItems: FeeItems }) => {
  if (!networkInfo) return "network info not loaded";
  return `network fees: ${networkInfo.feeItems.items
    .map((i) => i.key + "=" + i.feePerByte.toString())
    .join(", ")}`;
};

export const formatTransaction = (t: Transaction, account: Account): string =>
  `
  SEND ${formatCurrencyUnit(getAccountUnit(account), t.amount, {
    showCode: true,
    disableRounding: true,
  })}
  TO ${t.recipient}
  with feePerByte=${
    t.feePerByte ? t.feePerByte.toString() : "?"
  } (${formatNetworkInfo(t.networkInfo)})`;

export default { fromTransactionRaw, toTransactionRaw, formatTransaction };

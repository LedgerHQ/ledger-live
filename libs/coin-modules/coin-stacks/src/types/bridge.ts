import { AnchorMode } from "@stacks/transactions";
import BigNumber from "bignumber.js";

import {
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

import { StacksNetwork } from "../network/api.types";

type FamilyType = "stacks";

export type NetworkInfo = {
  family: FamilyType;
};
export type NetworkInfoRaw = {
  family: FamilyType;
};

export function isStacksTransaction(tx: TransactionCommon): tx is Transaction {
  return tx.family === "stacks";
}
export type Transaction = TransactionCommon & {
  family: FamilyType;
  fee?: BigNumber;
  nonce?: BigNumber;
  memo?: string;
  network: keyof typeof StacksNetwork;
  anchorMode: AnchorMode;
};

export function isStacksTransactionRaw(tx: TransactionCommonRaw): tx is TransactionRaw {
  return tx.family === "stacks";
}
export type TransactionRaw = TransactionCommonRaw & {
  family: FamilyType;
  fee?: string;
  nonce?: string;
  memo?: string;
  network: string;
  anchorMode: number;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type StacksOperation = Operation<StacksOperationExtra>;

export type StacksOperationExtra = {
  memo?: string | undefined;
};

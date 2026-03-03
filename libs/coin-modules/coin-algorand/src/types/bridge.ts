import type {
  Account,
  AccountRaw,
  Operation,
  OperationExtra,
  OperationExtraRaw,
  OperationRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";
import type { AlgorandOperationMode } from "./model";

export const AlgorandOperationTypeEnum = {
  PAYMENT: 0,
  ASSET_OPT_IN: 7,
  ASSET_OPT_OUT: 8,
  ASSET_TRANSFER: 9,
};

export type AlgorandResourcesBridge = {
  rewards: BigNumber;
  nbAssets: number;
};

export type AlgorandResourcesRaw = {
  rewards: string;
  nbAssets: number;
};

export type AlgorandTransaction = TransactionCommon & {
  family: "algorand";
  mode: AlgorandOperationMode;
  fees: BigNumber | null | undefined;
  assetId: string | null | undefined;
  memo: string | null | undefined;
};

export type AlgorandTransactionRaw = TransactionCommonRaw & {
  family: "algorand";
  mode: AlgorandOperationMode;
  fees: string | null | undefined;
  assetId: string | null | undefined;
  memo: string | null | undefined;
};

export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;
export type Transaction = AlgorandTransaction;
export type TransactionRaw = AlgorandTransactionRaw;

export type AlgorandOperation = Operation<AlgorandOperationExtra>;
export type AlgorandOperationRaw = OperationRaw<AlgorandOperationExtraRaw>;

export type AlgorandOperationExtra = {
  rewards?: BigNumber | undefined;
  memo?: string | undefined;
  assetId?: string | undefined;
};

export function isAlgorandOperationExtra(op: OperationExtra): op is AlgorandOperationExtra {
  return (
    op !== null && typeof op === "object" && ("rewards" in op || "memo" in op || "assetId" in op)
  );
}

export type AlgorandOperationExtraRaw = {
  rewards?: string | undefined;
  memo?: string | undefined;
  assetId?: string | undefined;
};

export function isAlgorandOperationExtraRaw(
  op: OperationExtraRaw,
): op is AlgorandOperationExtraRaw {
  return (
    op !== null && typeof op === "object" && ("rewards" in op || "memo" in op || "assetId" in op)
  );
}

export type AlgorandAccount = Account & {
  algorandResources: AlgorandResourcesBridge;
};

export type AlgorandAccountRaw = AccountRaw & {
  algorandResources: AlgorandResourcesRaw;
};

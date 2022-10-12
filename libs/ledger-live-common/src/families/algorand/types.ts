import type { BigNumber } from "bignumber.js";
import type {
  Account,
  AccountRaw,
  Operation,
  OperationRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

export const AlgorandOperationTypeEnum = {
  PAYMENT: 0,
  ASSET_OPT_IN: 7,
  ASSET_OPT_OUT: 8,
  ASSET_TRANSFER: 9,
};

export type AlgorandResources = {
  rewards: BigNumber;
  // Ledger Live only supports a limited list of ASA (defined here https://github.com/LedgerHQ/ledgerjs/blob/master/packages/cryptoassets/data/asa.js)
  // This is the actual number of ASA opted-in for the Algo account
  nbAssets: number;
};
export type AlgorandResourcesRaw = {
  rewards: string;
  nbAssets: number;
};
export type AlgorandOperationMode = "send" | "optIn" | "claimReward";

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
export type AlgorandOperation = Operation & {
  extra: AlgorandExtraTxInfo;
};
export type AlgorandOperationRaw = OperationRaw & {
  extra: AlgorandExtraTxInfo;
};
export type AlgorandExtraTxInfo = {
  rewards?: BigNumber;
  memo?: string;
  assetId?: string;
};
export type AlgorandAccount = Account & {
  algorandResources: AlgorandResources;
};
export type AlgorandAccountRaw = AccountRaw & {
  algorandResources: AlgorandResourcesRaw;
};

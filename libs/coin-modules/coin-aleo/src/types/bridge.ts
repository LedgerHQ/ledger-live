import BigNumber from "bignumber.js";
import type {
  Account,
  AccountRaw,
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import type { AleoTransactionType } from "./api";
import type { ProvableApi, AleoUnspentRecord, TransactionType } from "./logic";

export type Transaction = TransactionCommon & {
  family: "aleo";
  type: TransactionType;
  fees: BigNumber;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "aleo";
  type: TransactionType;
  fees: string;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export interface AleoResources {
  transparentBalance: BigNumber;
  provableApi: ProvableApi | null;
  privateBalance: BigNumber | null;
  unspentPrivateRecords: AleoUnspentRecord[] | null;
  lastPrivateSyncDate: Date | null;
}

export interface AleoResourcesRaw {
  transparentBalance: string;
  provableApi: string | null;
  privateBalance: string | null;
  unspentPrivateRecords: string | null;
  lastPrivateSyncDate: string | null;
}

export type AleoAccount = Account & {
  aleoResources?: AleoResources;
};

export type AleoAccountRaw = AccountRaw & {
  aleoResources?: AleoResourcesRaw;
};

export type AleoOperationExtra = {
  functionId: string;
  transactionType: AleoTransactionType;
};

export type AleoOperation = Operation<AleoOperationExtra>;

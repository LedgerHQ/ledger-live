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
import type { ProvableApi, TransactionType } from "./logic";

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
}

export interface AleoResourcesRaw {
  transparentBalance: string;
  provableApi: string | null;
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

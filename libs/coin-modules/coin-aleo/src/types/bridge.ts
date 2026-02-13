import type {
  Account,
  AccountRaw,
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

export type Transaction = TransactionCommon & {
  family: "aleo";
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "aleo";
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export interface AleoResources {
  transparentBalance: BigNumber;
}

export interface AleoResourcesRaw {
  transparentBalance: string;
}

export type AleoAccount = Account & {
  aleoResources?: AleoResources;
};

export type AleoAccountRaw = AccountRaw & {
  aleoResources?: AleoResourcesRaw;
};

export type AleoTransactionType = "public" | "private";

export type AleoOperationExtra = {
  functionId: string;
  transactionType: AleoTransactionType;
};

export type AleoOperation = Operation<AleoOperationExtra>;

import type BigNumber from "bignumber.js";
import type {
  Account,
  AccountRaw,
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import { AleoJWT } from "./api";

export type Transaction = TransactionCommon & {
  family: "aleo";
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "aleo";
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export interface ProvableApi {
  apiKey: string;
  consumerId: string;
  jwt: AleoJWT;
  uuid: string;
}

export interface AleoResources {
  transparentBalance: BigNumber;
  privateBalance: BigNumber | null;
  provableApi: ProvableApi;
}

export interface AleoResourcesRaw {
  transparentBalance: string;
  privateBalance: string | null;
  provableApi: string;
}

export type AleoAccount = Account & {
  aleoResources: AleoResources;
};

export type AleoAccountRaw = AccountRaw & {
  aleoResources: AleoResourcesRaw;
};

export type AleoOperationExtra = {
  functionId?: string;
};

export type AleoOperation = Operation<AleoOperationExtra>;

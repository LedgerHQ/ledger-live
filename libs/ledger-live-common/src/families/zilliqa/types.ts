import { BN } from "@zilliqa-js/util";

import type {
  Account,
  AccountRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

export type ZilliqaResources = {
  publicKey: string;
  nonce: number;
};

export type ZilliqaResourcesRaw = {
  publicKey: string;
  nonce: number;
};

export type Transaction = TransactionCommon & {
  family: "zilliqa";
  gasPrice?: BN;
  gasLimit?: BN;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "zilliqa";
  gasPrice?: string;
  gasLimit?: string;
};
export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type ZilliqaAccount = Account & {
  zilliqaResources?: ZilliqaResources;
};
export type ZilliqaAccountRaw = AccountRaw & {
  zilliqaResources?: ZilliqaResourcesRaw;
};

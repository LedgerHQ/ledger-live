import type {
  Account,
  AccountRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

export type NetworkInfo = {
  family: "hedera";
};

export type NetworkInfoRaw = {
  family: "hedera";
};

export type UpdateAccountProperties = {
  name: "updateAccount";
  stakedNodeId?: number | null;
};

export type Transaction = TransactionCommon & {
  family: "hedera";
  memo?: string | undefined;
  properties?: UpdateAccountProperties;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "hedera";
  memo?: string | undefined;
  properties?: UpdateAccountProperties;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export interface HederaResources {
  stakingNodeId: number | null;
  stakingPendingReward: BigNumber;
}

export interface HederaResourcesRaw {
  stakingNodeId: number | null;
  stakingPendingReward: string;
}

export type HederaAccount = Account & {
  hederaResources?: HederaResources;
};

export type HederaAccountRaw = AccountRaw & {
  hederaResources?: HederaResourcesRaw;
};

export type HederaOperationExtra = {
  consensusTimestamp?: string;
  transactionId?: string;
};

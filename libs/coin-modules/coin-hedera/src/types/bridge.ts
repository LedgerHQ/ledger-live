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
  mode: "delegate" | "undelegate" | "redelegate";
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

export interface HederaDelegation {
  nodeId: number;
  delegated: BigNumber;
  pendingReward: BigNumber;
}

interface HederaDelegationRaw {
  nodeId: number;
  delegated: string;
  pendingReward: string;
}

export interface HederaResources {
  delegation: HederaDelegation | null;
}

export interface HederaResourcesRaw {
  delegation: HederaDelegationRaw | null;
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

export type HederaOperationType = "CryptoTransfer" | "CryptoUpdate";

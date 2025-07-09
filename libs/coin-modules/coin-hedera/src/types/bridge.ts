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

export type NetworkInfo = {
  family: "hedera";
};

export type NetworkInfoRaw = {
  family: "hedera";
};

export type StakingAction = "delegate" | "undelegate" | "redelegate" | "claimRewards";

export type StakingTransactionProperties = {
  name: "staking";
  mode: StakingAction;
  stakedNodeId?: number | null;
};

export type Transaction = TransactionCommon & {
  family: "hedera";
  memo?: string | undefined;
  properties?: StakingTransactionProperties;
  maxFee?: BigNumber | undefined;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "hedera";
  memo?: string | undefined;
  properties?: StakingTransactionProperties;
  maxFee?: string | undefined;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type HederaDelegationStatus = "active" | "inactive" | "overstaked";

export interface HederaDelegation {
  nodeId: number;
  delegated: BigNumber;
  pendingReward: BigNumber;
}

export interface HederaDelegationWithMeta extends HederaDelegation {
  status: HederaDelegationStatus;
  validator: HederaValidator;
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
  memo?: string | null;
};

export type HederaOperationType = "CryptoTransfer" | "CryptoUpdate";

export type HederaOperation = Operation<HederaOperationExtra>;

export type HederaValidator = {
  nodeId: number;
  minStake: BigNumber;
  maxStake: BigNumber;
  activeStake: BigNumber;
  activeStakePercentage: BigNumber;
  address: string;
  name: string;
  overstaked: boolean;
};

export type HederaPreloadData = {
  validators: HederaValidator[];
};

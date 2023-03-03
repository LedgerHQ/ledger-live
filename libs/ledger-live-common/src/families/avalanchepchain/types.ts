import type { BigNumber } from "bignumber.js";
import type {
  Account,
  AccountRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

export type NetworkInfo = {
  family: "avalanchepchain";
};
export type NetworkInfoRaw = {
  family: "avalanchepchain";
};

export type AvalanchePChainAccount = Account & {
  avalanchePChainResources: AvalanchePChainResources;
};

export type AvalanchePChainAccountRaw = AccountRaw & {
  avalanchePChainResources: AvalanchePChainResourcesRaw;
};

export type Transaction = TransactionCommon & {
  family: "avalanchepchain";
  fees: BigNumber | null;
  mode: "delegate";
  startTime: BigNumber | null;
  endTime: BigNumber | null;
  maxEndTime: BigNumber | null;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "avalanchepchain";
  fees: string | null;
  mode: "delegate";
  startTime: string | null;
  endTime: string | null;
  maxEndTime: string | null;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type AvalanchePChainResources = {
  publicKey: string;
  chainCode: string;
  stakedBalance: BigNumber;
  delegations: AvalancheDelegation[];
};

export type AvalanchePChainResourcesRaw = {
  publicKey: string;
  chainCode: string;
  stakedBalance: string;
  delegations: AvalancheDelegationRaw[];
};

export type AvalanchePChainPreloadData = {
  validators: AvalanchePChainValidator[];
};

export type AvalanchePChainValidator = {
  txID: string;
  startTime: string;
  endTime: string;
  stakeAmount: BigNumber;
  nodeID: string;
  rewardOwner: {
    lockTime: string;
    threshold: string;
    addresses: string[];
  };
  potentialReward: BigNumber;
  delegationFee: BigNumber;
  uptime: BigNumber;
  connected: boolean;
  delegators: AvalancheDelegation[];
  remainingStake: BigNumber;
};

export type AvalancheDelegation = {
  txID: string;
  startTime: string;
  endTime: string;
  stakeAmount: BigNumber;
  nodeID: string;
};

export type AvalancheDelegationRaw = {
  txID: string;
  startTime: string;
  endTime: string;
  stakeAmount: string;
  nodeID: string;
};

export const AvalanchePChainTransactions = {
  Import: "p_import",
  Export: "p_export",
  Delegate: "p_add_delegator",
};

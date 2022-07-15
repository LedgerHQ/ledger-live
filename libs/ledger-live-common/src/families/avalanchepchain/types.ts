import type { BigNumber } from "bignumber.js";
import type {
  TransactionCommon,
  TransactionCommonRaw,
} from "../../types/transaction";

export type NetworkInfo = {
  family: "avalanchepchain";
};
export type NetworkInfoRaw = {
  family: "avalanchepchain";
};
export type Transaction = TransactionCommon & {
  family: "avalanchepchain";
  fees: BigNumber | null;
  mode: string;
  startTime: BigNumber | null;
  endTime: BigNumber | null;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "avalanchepchain";
  fees: string | null;
  mode: string;
  startTime: string | null;
  endTime: string | null;
};

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
};

export type AvalancheDelegation = {
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
};

export type AvalancheDelegationRaw = {
  txID: string;
  startTime: string;
  endTime: string;
  stakeAmount: string;
  nodeID: string;
  rewardOwner: {
    lockTime: string;
    threshold: string;
    addresses: string[];
  };
  potentialReward: string;
};
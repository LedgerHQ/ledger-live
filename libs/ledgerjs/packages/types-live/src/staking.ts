import type { BigNumber } from "bignumber.js";
import type { Account, AccountRaw } from "./account";
import type { OperationExtra, OperationExtraRaw } from "./operation";

export type StakingDelegationStatus =
  | "bonded" // in the active set, generates rewards
  | "activating" // delegated but not yet in the active set, will start generating rewards next epoch
  | "unbonding" // validator removed from active set, voting power frozen for a network-specific unbonding period
  | "unbonded";

export type StakingDelegation = {
  validatorAddress: string;
  validatorId?: string;
  amount: BigNumber;
  pendingRewards: BigNumber;
  status: StakingDelegationStatus;
};

export type StakingDelegationRaw = {
  validatorAddress: string;
  validatorId?: string;
  amount: string;
  pendingRewards: string;
  status: StakingDelegationStatus;
};

export type StakingRedelegation = {
  validatorSrcAddress: string;
  validatorDstAddress: string;
  amount: BigNumber;
  completionDate: Date;
};

export type StakingRedelegationRaw = {
  validatorSrcAddress: string;
  validatorDstAddress: string;
  amount: string;
  completionDate: string;
};

export type StakingUnbonding = {
  validatorAddress: string;
  amount: BigNumber;
  completionDate: Date;
};

export type StakingUnbondingRaw = {
  validatorAddress: string;
  amount: string;
  completionDate: string;
};

export type StakingResources = {
  delegations: StakingDelegation[];
  redelegations: StakingRedelegation[];
  unbondings: StakingUnbonding[];
  delegatedBalance: BigNumber;
  pendingRewardsBalance: BigNumber;
  unbondingBalance: BigNumber;
  validators?: StakingValidatorItem[];
};

export type StakingResourcesRaw = {
  delegations: StakingDelegationRaw[];
  redelegations: StakingRedelegationRaw[];
  unbondings: StakingUnbondingRaw[];
  delegatedBalance: string;
  pendingRewardsBalance: string;
  unbondingBalance: string;
  validators?: StakingValidatorItem[];
};

export type StakingDelegationInfo = {
  address: string;
  amount: BigNumber;
};

export type StakingDelegationInfoRaw = {
  address: string;
  amount: string;
};

// NB this must be serializable (no Date, no BigNumber)
export type StakingValidatorItem = {
  validatorAddress: string;
  validatorId?: string;
  name: string;
  votingPower: number;
  // value from 0.0 to 1.0 (normalized percentage)
  commission: number;
  // value from 0.0 to 1.0 (normalized percentage)
  estimatedYearlyRewardsRate: number;
  tokens: string;
};

export type StakingLikeNetworkInfo = {
  family: string;
  fees: BigNumber;
};

export type StakingLikeNetworkInfoRaw = {
  family: string;
  fees: string;
};

export type StakingOperationExtra = OperationExtra & {
  validators?: StakingDelegationInfo[];
  validator?: StakingDelegationInfo;
  sourceValidator?: string;
};

export function isStakingOperationExtra(op: OperationExtra): op is StakingOperationExtra {
  return (
    op !== null &&
    typeof op === "object" &&
    ("validators" in op || "validator" in op || "sourceValidator" in op)
  );
}

export type StakingOperationExtraRaw = OperationExtraRaw & {
  validators?: StakingDelegationInfoRaw[];
  validator?: StakingDelegationInfoRaw;
  sourceValidator?: string;
};

export function isStakingOperationExtraRaw(op: OperationExtraRaw): op is StakingOperationExtraRaw {
  return (
    op !== null &&
    typeof op === "object" &&
    ("validators" in op || "validator" in op || "sourceValidator" in op)
  );
}

export type StakingMappedDelegation = StakingDelegation & {
  formattedAmount: string;
  formattedPendingRewards: string;
  rank: number;
  validator: StakingValidatorItem | null | undefined;
};

export type StakingMappedUnbonding = StakingUnbonding & {
  formattedAmount: string;
  validator: StakingValidatorItem | null | undefined;
};

export type StakingMappedRedelegation = StakingRedelegation & {
  formattedAmount: string;
  validatorSrc: StakingValidatorItem | null | undefined;
  validatorDst: StakingValidatorItem | null | undefined;
};

export type StakingMappedDelegationInfo = StakingDelegationInfo & {
  validator: StakingValidatorItem | null | undefined;
  formattedAmount: string;
};

export type StakingMappedValidator = {
  rank: number;
  validator: StakingValidatorItem;
};

export type StakingSearchFilter = (
  query: string,
) => (item: StakingMappedDelegation | StakingMappedValidator) => boolean;

export function isStakingAccount(account: Account): account is StakingAccount {
  return "stakingResources" in account;
}

export type StakingAccount = Account & { stakingResources: StakingResources };

export type StakingAccountRaw = AccountRaw & {
  stakingResources: StakingResourcesRaw;
};

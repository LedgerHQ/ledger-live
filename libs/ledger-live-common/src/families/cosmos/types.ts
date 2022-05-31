import type { BigNumber } from "bignumber.js";
import type {
  TransactionCommon,
  TransactionCommonRaw,
} from "../../types/transaction";
import type { Operation, OperationRaw } from "../../types/operation";

export type CosmosDelegationStatus =
  | "bonded" //  in the active set that generates rewards
  | "unbonding" // doesn't generate rewards. means the validator has been removed from the active set, but has its voting power "frozen" in case they misbehaved (just like a delegator undelegating). This last 21 days
  | "unbonded";
// doesn't generate rewards. means the validator has been removed from the active set for more than 21 days basically
export type CosmosDelegation = {
  validatorAddress: string;
  amount: BigNumber;
  pendingRewards: BigNumber;
  status: CosmosDelegationStatus;
};
export type CosmosRedelegation = {
  validatorSrcAddress: string;
  validatorDstAddress: string;
  amount: BigNumber;
  completionDate: Date;
};
export type CosmosUnbonding = {
  validatorAddress: string;
  amount: BigNumber;
  completionDate: Date;
};
export type CosmosResources = {
  delegations: CosmosDelegation[];
  redelegations: CosmosRedelegation[];
  unbondings: CosmosUnbonding[];
  delegatedBalance: BigNumber;
  pendingRewardsBalance: BigNumber;
  unbondingBalance: BigNumber;
  withdrawAddress: string;
};
export type CosmosDelegationRaw = {
  validatorAddress: string;
  amount: string;
  pendingRewards: string;
  status: CosmosDelegationStatus;
};
export type CosmosUnbondingRaw = {
  validatorAddress: string;
  amount: string;
  completionDate: string;
};
export type CosmosRedelegationRaw = {
  validatorSrcAddress: string;
  validatorDstAddress: string;
  amount: string;
  completionDate: string;
};
export type CosmosResourcesRaw = {
  delegations: CosmosDelegationRaw[];
  redelegations: CosmosRedelegationRaw[];
  unbondings: CosmosUnbondingRaw[];
  delegatedBalance: string;
  pendingRewardsBalance: string;
  unbondingBalance: string;
  withdrawAddress: string;
};
// NB this must be serializable (no Date, no BigNumber)
export type CosmosValidatorItem = {
  validatorAddress: string;
  name: string;
  votingPower: number;
  // value from 0.0 to 1.0 (normalized percentage)
  commission: number;
  // value from 0.0 to 1.0 (normalized percentage)
  estimatedYearlyRewardsRate: number; // value from 0.0 to 1.0 (normalized percentage)
  tokens: number;
};
export type CosmosRewardsState = {
  targetBondedRatio: number;
  communityPoolCommission: number;
  assumedTimePerBlock: number;
  inflationRateChange: number;
  inflationMaxRate: number;
  inflationMinRate: number;
  actualBondedRatio: number;
  averageTimePerBlock: number;
  totalSupply: number;
  averageDailyFees: number;
  currentValueInflation: number;
};
// by convention preload would return a Promise of CosmosPreloadData
export type CosmosPreloadData = {
  validators: CosmosValidatorItem[];
};
export type CosmosOperationMode =
  | "send"
  | "delegate"
  | "undelegate"
  | "redelegate"
  | "claimReward"
  | "claimRewardCompound";
export type NetworkInfo = {
  family: "cosmos";
  fees: BigNumber;
};
export type NetworkInfoRaw = {
  family: "cosmos";
  fees: string;
};
export type CosmosOperation = Operation & {
  extra: CosmosExtraTxInfo;
};
export type CosmosOperationRaw = OperationRaw & {
  extra: CosmosExtraTxInfo;
};
export type CosmosExtraTxInfo = {
  validators?: CosmosDelegationInfo[];
  cosmosSourceValidator?: string | null | undefined;
  validator?: CosmosDelegationInfo;
};

export type CosmosDelegationInfo = {
  address: string;
  amount: BigNumber;
};
export type CosmosDelegationInfoRaw = {
  address: string;
  amount: string;
};

export type Transaction = TransactionCommon & {
  family: "cosmos";
  mode: CosmosOperationMode;
  networkInfo: NetworkInfo | null | undefined;
  fees: BigNumber | null | undefined;
  gas: BigNumber | null | undefined;
  memo: string | null | undefined;
  validators: CosmosDelegationInfo[];
  cosmosSourceValidator: string | null | undefined;
};
export type TransactionRaw = TransactionCommonRaw & {
  family: "cosmos";
  mode: CosmosOperationMode;
  networkInfo: NetworkInfoRaw | null | undefined;
  fees: string | null | undefined;
  gas: string | null | undefined;
  memo: string | null | undefined;
  validators: CosmosDelegationInfoRaw[];
  cosmosSourceValidator: string | null | undefined;
};

export type StatusErrorMap = {
  recipient?: Error;
  amount?: Error;
  fees?: Error;
  validators?: Error;
  delegate?: Error;
  redelegation?: Error;
  unbonding?: Error;
  claimReward?: Error;
  feeTooHigh?: Error;
};

export type TransactionStatus = {
  errors: StatusErrorMap;
  warnings: StatusErrorMap;
  estimatedFees: BigNumber;
  amount: BigNumber;
  totalSpent: BigNumber;
};

export type CosmosMappedDelegation = CosmosDelegation & {
  formattedAmount: string;
  formattedPendingRewards: string;
  rank: number;
  validator: CosmosValidatorItem | null | undefined;
};
export type CosmosMappedUnbonding = CosmosUnbonding & {
  formattedAmount: string;
  validator: CosmosValidatorItem | null | undefined;
};
export type CosmosMappedRedelegation = CosmosRedelegation & {
  formattedAmount: string;
  validatorSrc: CosmosValidatorItem | null | undefined;
  validatorDst: CosmosValidatorItem | null | undefined;
};
export type CosmosMappedDelegationInfo = CosmosDelegationInfo & {
  validator: CosmosValidatorItem | null | undefined;
  formattedAmount: string;
};
export type CosmosMappedValidator = {
  rank: number;
  validator: CosmosValidatorItem;
};
export type CosmosSearchFilter = (
  query: string
) => (delegation: CosmosMappedDelegation | CosmosMappedValidator) => boolean;

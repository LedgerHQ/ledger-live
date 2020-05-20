// @flow

import type { BigNumber } from "bignumber.js";
import type {
  TransactionCommon,
  TransactionCommonRaw,
} from "../../types/transaction";

import type { Operation, OperationRaw } from "../../types/operation";

export type CoreStatics = {};
export type CoreAccountSpecifics = {};
export type CoreOperationSpecifics = {};
export type CoreCurrencySpecifics = {};

export type CosmosDelegationStatus =
  | "bonded" //  in the active set that generates rewards
  | "unbonding" // doesn't generate rewards. means the validator has been removed from the active set, but has its voting power "frozen" in case they misbehaved (just like a delegator undelegating). This last 21 days
  | "unbonded"; // doesn't generate rewards. means the validator has been removed from the active set for more than 21 days basically

export type CosmosDelegation = {
  validatorAddress: string,
  amount: BigNumber,
  pendingRewards: BigNumber,
  status: CosmosDelegationStatus,
};

export type CosmosResources = {|
  delegations: CosmosDelegation[],
  delegatedBalance: BigNumber,
  pendingRewardsBalance: BigNumber,
  unboundingBalance: BigNumber,
  withdrawAddress: string,
|};

export type CosmosDelegationRaw = {|
  validatorAddress: string,
  amount: string,
  pendingRewards: string,
  status: CosmosDelegationStatus,
|};

export type CosmosResourcesRaw = {|
  delegations: CosmosDelegationRaw[],
  delegatedBalance: string,
  pendingRewardsBalance: string,
  unboundingBalance: string,
  withdrawAddress: string,
|};

// NB this must be serializable (no Date, no BigNumber)
export type CosmosValidatorItem = {|
  validatorAddress: string,
  name: string,
  votingPower: number, // value from 0.0 to 1.0 (normalized percentage)
  commission: number, // value from 0.0 to 1.0 (normalized percentage)
|};

export type CosmosRewardsState = {|
  targetBondedRatio: number,
  communityPoolCommission: number,
  assumedTimePerBlock: number,
  inflationRateChange: number,
  inflationMaxRate: number,
  inflationMinRate: number,
  actualBondedRatio: number,
  averageTimePerBlock: number,
  totalSupply: number,
  averageDailyFees: number,
  currentValueInflation: number,
|};

// by convention preload would return a Promise of CosmosPreloadData
export type CosmosPreloadData = {
  validators: CosmosValidatorItem[],
  rewardsState: CosmosRewardsState,
};

export type CosmosOperationMode =
  | "send"
  | "delegate"
  | "undelegate"
  | "redelegate"
  | "claimReward"
  | "claimRewardCompound";

export type NetworkInfo = {|
  family: "cosmos",
  fees: BigNumber,
|};

export type NetworkInfoRaw = {|
  family: "cosmos",
  fees: string,
|};

export type CosmosOperation = {|
  ...Operation,
  extra: CosmosExtraTxInfo,
|};

export type CosmosOperationRaw = {|
  ...OperationRaw,
  extra: CosmosExtraTxInfo,
|};

export type CosmosExtraTxInfo =
  | CosmosDelegateTxInfo
  | CosmosUndelegateTxInfo
  | CosmosRedelegateTxInfo
  | CosmosClaimRewardsTxInfo;

export type CosmosDelegateTxInfo = {|
  validators: CosmosDelegationInfo[],
|};

export type CosmosUndelegateTxInfo = {|
  validator: CosmosDelegationInfo,
|};
export type CosmosRedelegateTxInfo = {|
  validator: CosmosDelegationInfo,
  cosmosSourceValidator: ?string,
|};

export type CosmosClaimRewardsTxInfo = {|
  validator: CosmosDelegationInfo,
|};

export type CosmosDelegationInfo = {
  address: string,
  amount: BigNumber,
};

export type CosmosValidatorRaw = {
  address: string,
  amount: string,
};

export type Transaction = {|
  ...TransactionCommon,
  family: "cosmos",
  mode: CosmosOperationMode,
  networkInfo: ?NetworkInfo,
  fees: ?BigNumber,
  gasLimit: ?BigNumber,
  memo: ?string,
  validators: ?(CosmosDelegationInfo[]),
  cosmosSourceValidator: ?string,
|};

export type TransactionRaw = {|
  ...TransactionCommonRaw,
  family: "cosmos",
  mode: CosmosOperationMode,
  networkInfo: ?NetworkInfoRaw,
  fees: ?string,
  gasLimit: ?string,
  memo: ?string,
  validators: ?(CosmosValidatorRaw[]),
  cosmosSourceValidator: ?string,
|};

export const reflect = (_declare: *) => {};

export type CosmosFormattedDelegation = CosmosDelegation & {
  formattedAmount: string,
  formattedPendingRewards: string,
  rank: number,
  validator: CosmosValidatorItem,
};

export type CosmosFormattedValidator = {
  rank: number,
  validator: CosmosValidatorItem,
};

export type CosmosValidatorSearchFilter = (
  query: string
) => (validator: CosmosFormattedValidator) => boolean;

export type CosmosDelegationSearchFilter = (
  query: string
) => (
  delegation: CosmosFormattedDelegation | CosmosFormattedValidator
) => boolean;

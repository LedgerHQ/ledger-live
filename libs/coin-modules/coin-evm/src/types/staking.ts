import type { Stake } from "@ledgerhq/coin-module-framework/api/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, AccountRaw, OperationExtra, OperationExtraRaw } from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";

export type StakingDelegationStatus =
  | "bonded" // in the active set, generates rewards
  | "unbonding" // validator removed from active set, voting power frozen for a network-specific unbonding period
  | "unbonded";

export type StakingDelegation = {
  validatorAddress: string;
  amount: BigNumber;
  pendingRewards: BigNumber;
  status: StakingDelegationStatus;
};

export type StakingDelegationRaw = {
  validatorAddress: string;
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

export type StakingOperation =
  | "delegate"
  | "undelegate"
  | "redelegate"
  | "getStakedBalance"
  | "getUnstakedBalance";

export type StakingContractConfig = {
  contractAddress: string;
  functions: Partial<Record<StakingOperation, string>> & {
    // necessary function names below
    delegate: string;
    undelegate: string;
    getStakedBalance: string;
  };
  apiConfig?: {
    baseUrl: string;
    validatorsEndpoint: string;
  };
  explorerConfig?: {
    validatorUrl: string;
  };
  unbondingPeriodDays?: number;
};

export type StakeCreate = {
  currency: CryptoCurrency;
  address: string;
  currencyId: string;
  validatorAddress: string;
  config: StakingContractConfig;
};

type SeiDelegationBalance = {
  amount: string | number | bigint;
  denom: string;
};

type SeiDelegationDetails = {
  delegator_address: string;
  shares: string | number;
  decimals: string | number;
  validator_address: string;
};

export type SeiDelegation = {
  balance: SeiDelegationBalance;
  delegation: SeiDelegationDetails;
};

export type StakingFetcher = (
  address: string,
  config: StakingContractConfig,
  currency: CryptoCurrency,
) => Promise<Stake[]>;

/**
 * Configuration for a staking strategy
 */
export type StakingStrategy = {
  fetcher: StakingFetcher;
};

/**
 * Function signature for amount extractors
 */
export type StakingExtractor = (decoded: unknown) => bigint;

export interface EncodeStakingDataParams {
  currencyId: string;
  operation: StakingOperation;
  config: StakingContractConfig;
  params: unknown[];
}

// NB this must be serializable (no Date, no BigNumber)
export type StakingValidatorItem = {
  validatorAddress: string;
  name: string;
  votingPower: number;
  // value from 0.0 to 1.0 (normalized percentage)
  commission: number;
  // value from 0.0 to 1.0 (normalized percentage)
  estimatedYearlyRewardsRate: number; // value from 0.0 to 1.0 (normalized percentage)
  tokens: number;
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

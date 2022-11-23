import type { BigNumber } from "bignumber.js";
import {
	Account,
	AccountRaw,
	Operation,
	OperationRaw,
	TransactionCommon,
	TransactionCommonRaw,
	TransactionStatusCommon,
	TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

export type ZilliqaDelegationStatus =
	| "bonded" //  in the active set that generates rewards
	| "unbonding" // doesn't generate rewards. means the validator has been removed from the active set, but has its voting power "frozen" in case they misbehaved (just like a delegator undelegating). This last 21 days
	| "unbonded";
// doesn't generate rewards. means the validator has been removed from the active set for more than 21 days basically
export type ZilliqaDelegation = {
	validatorAddress: string;
	amount: BigNumber;
	pendingRewards: BigNumber;
	status: ZilliqaDelegationStatus;
};
export type ZilliqaRedelegation = {
	validatorSrcAddress: string;
	validatorDstAddress: string;
	amount: BigNumber;
	completionDate: Date;
};
export type ZilliqaUnbonding = {
	validatorAddress: string;
	amount: BigNumber;
	completionDate: Date;
};
export type ZilliqaResources = {
	delegations: ZilliqaDelegation[];
	redelegations: ZilliqaRedelegation[];
	unbondings: ZilliqaUnbonding[];
	delegatedBalance: BigNumber;
	pendingRewardsBalance: BigNumber;
	unbondingBalance: BigNumber;
	withdrawAddress: string;
};
export type ZilliqaDelegationRaw = {
	validatorAddress: string;
	amount: string;
	pendingRewards: string;
	status: ZilliqaDelegationStatus;
};
export type ZilliqaUnbondingRaw = {
	validatorAddress: string;
	amount: string;
	completionDate: string;
};
export type ZilliqaRedelegationRaw = {
	validatorSrcAddress: string;
	validatorDstAddress: string;
	amount: string;
	completionDate: string;
};
export type ZilliqaResourcesRaw = {
	delegations: ZilliqaDelegationRaw[];
	redelegations: ZilliqaRedelegationRaw[];
	unbondings: ZilliqaUnbondingRaw[];
	delegatedBalance: string;
	pendingRewardsBalance: string;
	unbondingBalance: string;
	withdrawAddress: string;
};
// NB this must be serializable (no Date, no BigNumber)
export type ZilliqaValidatorItem = {
	validatorAddress: string;
	name: string;
	votingPower: number;
	// value from 0.0 to 1.0 (normalized percentage)
	commission: number;
	// value from 0.0 to 1.0 (normalized percentage)
	estimatedYearlyRewardsRate: number; // value from 0.0 to 1.0 (normalized percentage)
	tokens: number;
};
export type ZilliqaRewardsState = {
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
// by convention preload would return a Promise of ZilliqaPreloadData
export type ZilliqaPreloadData = {
	validators: ZilliqaValidatorItem[];
};
export type ZilliqaOperationMode =
	| "send"
	| "delegate"
	| "undelegate"
	| "redelegate"
	| "claimReward"
	| "claimRewardCompound";

export type ZilliqaLikeNetworkInfo = {
	family: string;
	fees: BigNumber;
};

export type ZilliqaLikeNetworkInfoRaw = {
	family: string;
	fees: string;
};

export type NetworkInfo = ZilliqaLikeNetworkInfo & {
	family: "zilliqa";
};

export type NetworkInfoRaw = ZilliqaLikeNetworkInfoRaw & {
	family: "zilliqa";
};

export type ZilliqaOperation = Operation & {
	extra: ZilliqaExtraTxInfo;
};
export type ZilliqaOperationRaw = OperationRaw & {
	extra: ZilliqaExtraTxInfo;
};
export type ZilliqaExtraTxInfo = {
	validators?: ZilliqaDelegationInfo[];
	sourceValidator?: string | null | undefined;
	validator?: ZilliqaDelegationInfo;
	autoClaimedRewards?: string | null | undefined; // this is experimental to better represent auto claimed rewards
};

export type ZilliqaDelegationInfo = {
	address: string;
	amount: BigNumber;
};

export type ZilliqaDelegationInfoRaw = {
	address: string;
	amount: string;
};

export type ZilliqaClaimedRewardInfo = {
	amount: BigNumber;
};

export type ZilliqaLikeTransaction = TransactionCommon & {
	family: string;
	mode: ZilliqaOperationMode;
	networkInfo: ZilliqaLikeNetworkInfo | null | undefined;
	fees: BigNumber | null | undefined;
	gas: BigNumber | null | undefined;
	memo: string | null | undefined;
	validators: ZilliqaDelegationInfo[];
	sourceValidator: string | null | undefined;
};

export type Transaction = ZilliqaLikeTransaction & {
	family: "zilliqa";
	networkInfo: NetworkInfo | null | undefined;
};

export type ZilliqaLikeTransactionRaw = TransactionCommonRaw & {
	family: string;
	mode: ZilliqaOperationMode;
	networkInfo: ZilliqaLikeNetworkInfoRaw | null | undefined;
	fees: string | null | undefined;
	gas: string | null | undefined;
	memo: string | null | undefined;
	validators: ZilliqaDelegationInfoRaw[];
	sourceValidator: string | null | undefined;
};

export type TransactionRaw = ZilliqaLikeTransactionRaw & {
	family: "zilliqa";
	networkInfo: NetworkInfoRaw | null | undefined;
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

export type ZilliqaMappedDelegation = ZilliqaDelegation & {
	formattedAmount: string;
	formattedPendingRewards: string;
	rank: number;
	validator: ZilliqaValidatorItem | null | undefined;
};
export type ZilliqaMappedUnbonding = ZilliqaUnbonding & {
	formattedAmount: string;
	validator: ZilliqaValidatorItem | null | undefined;
};
export type ZilliqaMappedRedelegation = ZilliqaRedelegation & {
	formattedAmount: string;
	validatorSrc: ZilliqaValidatorItem | null | undefined;
	validatorDst: ZilliqaValidatorItem | null | undefined;
};
export type ZilliqaMappedDelegationInfo = ZilliqaDelegationInfo & {
	validator: ZilliqaValidatorItem | null | undefined;
	formattedAmount: string;
};
export type ZilliqaMappedValidator = {
	rank: number;
	validator: ZilliqaValidatorItem;
};
export type ZilliqaSearchFilter = (
	query: string
) => (delegation: ZilliqaMappedDelegation | ZilliqaMappedValidator) => boolean;
export type ZilliqaAccount = Account & { zilliqaResources: ZilliqaResources };
export type ZilliqaAccountRaw = AccountRaw & {
	zilliqaResources: ZilliqaResourcesRaw;
};
export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

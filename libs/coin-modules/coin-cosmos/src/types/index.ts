import type { BigNumber } from "bignumber.js";
import {
  Account,
  AccountRaw,
  Operation,
  OperationExtra,
  OperationExtraRaw,
  OperationRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

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

export type CosmosTx = {
  code: number;
  codespace: string;
  data: string;
  events: CosmosMessage[];
  gas_used: string;
  gas_wanted: string;
  height: string;
  info: string;
  logs: any[];
  raw_log: string;
  timestamp: string;
  tx: { "@type": string; body: any; auth_info: any; signatures: any[] };
  txhash: string;
};

export type CosmosMessage = {
  type: string;
  attributes: { key: string; value: string; index?: boolean }[];
};

export type CosmosResources = {
  delegations: CosmosDelegation[];
  redelegations: CosmosRedelegation[];
  unbondings: CosmosUnbonding[];
  delegatedBalance: BigNumber;
  pendingRewardsBalance: BigNumber;
  unbondingBalance: BigNumber;
  withdrawAddress: string;
  sequence: number;
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
  sequence: number;
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

export type CosmosLikeNetworkInfo = {
  family: string;
  fees: BigNumber;
};

export type CosmosLikeNetworkInfoRaw = {
  family: string;
  fees: string;
};

export type NetworkInfo = CosmosLikeNetworkInfo & {
  family: "cosmos";
};

export type NetworkInfoRaw = CosmosLikeNetworkInfoRaw & {
  family: "cosmos";
};

export type CosmosOperation = Operation<CosmosOperationExtra>;
export type CosmosOperationRaw = OperationRaw<CosmosOperationExtraRaw>;

export type CosmosOperationExtra = OperationExtra & {
  validators?: CosmosDelegationInfo[];
  validator?: CosmosDelegationInfo;
  sourceValidator?: string;
  autoClaimedRewards?: string; // this is experimental to better represent auto claimed rewards
  memo?: string;
};
export function isCosmosOperationExtra(op: OperationExtra): op is CosmosOperationExtra {
  return (
    op !== null &&
    typeof op === "object" &&
    ("validators" in op ||
      "validator" in op ||
      "sourceValidator" in op ||
      "autoClaimedRewards" in op ||
      "memo" in op)
  );
}

export type CosmosOperationExtraRaw = OperationExtraRaw & {
  validators?: CosmosDelegationInfoRaw[];
  validator?: CosmosDelegationInfoRaw;
  sourceValidator?: string;
  autoClaimedRewards?: string; // this is experimental to better represent auto claimed rewards
  memo?: string;
};
export function isCosmosOperationExtraRaw(op: OperationExtraRaw): op is CosmosOperationExtraRaw {
  return (
    op !== null &&
    typeof op === "object" &&
    ("validators" in op ||
      "validator" in op ||
      "sourceValidator" in op ||
      "autoClaimedRewards" in op ||
      "memo" in op)
  );
}

export type CosmosDelegationInfo = {
  address: string;
  amount: BigNumber;
};

export type CosmosDelegationInfoRaw = {
  address: string;
  amount: string;
};

export type CosmosLikeTransaction = TransactionCommon & {
  family: string;
  mode: CosmosOperationMode;
  networkInfo: CosmosLikeNetworkInfo | null | undefined;
  fees: BigNumber | null | undefined;
  gas: BigNumber | null | undefined;
  memo: string | null | undefined;
  validators: CosmosDelegationInfo[];
  sourceValidator: string | null | undefined;
};

export type Transaction = CosmosLikeTransaction & {
  family: "cosmos";
  networkInfo: NetworkInfo | null | undefined;
};

export type CosmosLikeTransactionRaw = TransactionCommonRaw & {
  family: string;
  mode: CosmosOperationMode;
  networkInfo: CosmosLikeNetworkInfoRaw | null | undefined;
  fees: string | null | undefined;
  gas: string | null | undefined;
  memo: string | null | undefined;
  validators: CosmosDelegationInfoRaw[];
  sourceValidator: string | null | undefined;
};

export type TransactionRaw = CosmosLikeTransactionRaw & {
  family: "cosmos";
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
  query: string,
) => (delegation: CosmosMappedDelegation | CosmosMappedValidator) => boolean;
export function isCosmosAccount(account: Account): account is CosmosAccount {
  return "cosmosResources" in account;
}
export type CosmosAccount = Account & { cosmosResources: CosmosResources };
export type CosmosAccountRaw = AccountRaw & {
  cosmosResources: CosmosResourcesRaw;
};
export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type CosmosTotalSupply = {
  denom: string;
  amount: string;
};

export type CosmosPool = {
  not_bonded_tokens: string;
  bonded_tokens: string;
};

export type CosmosDistributionParams = {
  community_tax: string;
  base_proposer_reward: string;
  bonus_proposer_reward: string;
  withdraw_addr_enabled: boolean;
};

export type CosmosCurrencyConfig = {
  lcd: string;
  minGasPrice: number;
  ledgerValidator?: string;
};

export const RETURN_CODES = {
  EXPERT_MODE_REQUIRED: 27012,
  REFUSED_OPERATION: 27014,
};

// NOTE: didn't follow what was in libs/ledgerjs/packages/hw-app-cosmos/src/Cosmos.ts
export interface CosmosSignerOld {
  getAddress(
    path: string,
    chainPrefix: number,
    verify: boolean,
  ): Promise<{ address: any; publicKey: any }>;
  sign(
    path: string,
    tx: Uint8Array,
    chainPrefix?: string,
  ): Promise<{ return_code: any; signature: any }>;
}

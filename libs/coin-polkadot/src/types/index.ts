import type {
  Account,
  AccountRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
  Operation,
  OperationRaw,
} from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";

export * from "./errors";
export * from "./signer";

export type RewardDestinationType = "Staked" | "Stash" | "Account" | "Controller";
export type PolkadotNominationStatus = "active" | "inactive" | "waiting" | null;
export type PolkadotOperationMode =
  | "send"
  | "bond"
  | "unbond"
  | "rebond"
  | "withdrawUnbonded"
  | "setController"
  | "nominate"
  | "chill"
  | "claimReward";
export type PolkadotNomination = {
  address: string;
  value: BigNumber;
  status: PolkadotNominationStatus;
};
export type PolkadotNominationRaw = {
  address: string;
  value: string;
  status: PolkadotNominationStatus;
};
export type PolkadotUnlocking = {
  amount: BigNumber;
  completionDate: Date;
};
export type PolkadotUnlockingRaw = {
  amount: string;
  completionDate: string;
};
export type PolkadotResources = {
  controller: string | null | undefined;
  stash: string | null | undefined;
  nonce: number;
  lockedBalance: BigNumber;
  unlockedBalance: BigNumber;
  unlockingBalance: BigNumber;
  unlockings: PolkadotUnlocking[] | null | undefined;
  nominations: PolkadotNomination[] | null | undefined;
  numSlashingSpans: number;
};
export type PolkadotResourcesRaw = {
  controller: string | null | undefined;
  stash: string | null | undefined;
  nonce: number;
  lockedBalance: string;
  unlockedBalance: string;
  unlockingBalance: string;
  unlockings: PolkadotUnlockingRaw[] | null | undefined;
  nominations: PolkadotNominationRaw[] | null | undefined;
  numSlashingSpans: number;
};
export type Transaction = TransactionCommon & {
  mode: PolkadotOperationMode;
  family: "polkadot";
  fees: BigNumber | null | undefined;
  validators: string[] | undefined;
  era: string | null | undefined;
  rewardDestination: string | null | undefined;
  numSlashingSpans: number | null | undefined;
};
export type TransactionRaw = TransactionCommonRaw & {
  family: "polkadot";
  mode: PolkadotOperationMode;
  fees: string | null | undefined;
  validators: string[] | undefined;
  era: string | null | undefined;
  rewardDestination: string | null | undefined;
  numSlashingSpans: number | null | undefined;
};

export type PolkadotValidator = {
  address: string;
  identity: string;
  nominatorsCount: number;
  rewardPoints: BigNumber | null;
  commission: BigNumber;
  totalBonded: BigNumber;
  selfBonded: BigNumber;
  isElected: boolean;
  isOversubscribed: boolean;
};

export type PolkadotNominationInfo = string;
export type PolkadotStakingProgress = {
  activeEra: number;
  electionClosed: boolean;
  maxNominatorRewardedPerValidator: number;
  bondingDuration: number;
};
export type PolkadotPreloadData = {
  validators: PolkadotValidator[];
  staking: PolkadotStakingProgress | undefined;
  minimumBondBalance: string;
};
export type PolkadotSearchFilter = (query: string) => (validator: PolkadotValidator) => boolean;
export type PolkadotAccount = Account & {
  polkadotResources: PolkadotResources;
};
export type PolkadotAccountRaw = AccountRaw & {
  polkadotResources: PolkadotResourcesRaw;
};
export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type PolkadotOperation = Operation<PolkadotOperationExtra>;
export type PolkadotOperationRaw = OperationRaw<PolkadotOperationExtraRaw>;

export type PolkadotOperationExtra = {
  transferAmount?: BigNumber;
  palletMethod: string;
  bondedAmount?: BigNumber;
  unbondedAmount?: BigNumber;
  withdrawUnbondedAmount?: BigNumber;
  validatorStash?: string;
  validators?: string[];
};
export type PolkadotOperationExtraRaw = {
  transferAmount?: string;
  palletMethod: string;
  bondedAmount?: string;
  unbondedAmount?: string;
  withdrawUnbondedAmount?: string;
  validatorStash?: string;
  validators?: string[];
};

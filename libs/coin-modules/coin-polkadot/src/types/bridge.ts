/**
 * Bridge type definition
 */

import type {
  Account,
  AccountRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
  Operation,
  OperationRaw,
  OperationExtra,
  OperationExtraRaw,
} from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";
import { PolkadotOperationMode } from "./model";

export type RewardDestinationType = "Staked" | "Stash" | "Account" | "Controller";
export type PolkadotNominationStatus = "active" | "inactive" | "waiting" | null;
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
  numSlashingSpans: number | undefined;
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
  numSlashingSpans: number | undefined;
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

export type PalletMethod =
  | "balances.transfer"
  | "balances.transferKeepAlive"
  | "balances.transferAllowDeath"
  | "staking.bond"
  | "staking.bondExtra"
  | "staking.unbond"
  | "staking.rebond"
  | "staking.withdrawUnbonded"
  | "staking.nominate"
  | "staking.chill"
  | "staking.setController"
  | "staking.payoutStakers";

export type PolkadotOperationExtra = {
  transferAmount?: BigNumber;
  palletMethod: PalletMethod;
  bondedAmount?: BigNumber;
  unbondedAmount?: BigNumber;
  withdrawUnbondedAmount?: BigNumber;
  validatorStash?: string | undefined;
  validators?: string[] | undefined;
};

export function isPolkadotOperationExtra(op: OperationExtra): op is PolkadotOperationExtra {
  return op !== null && typeof op === "object" && "palletMethod" in op;
}

export type PolkadotOperationExtraRaw = {
  transferAmount?: string;
  palletMethod: string;
  bondedAmount?: string;
  unbondedAmount?: string;
  withdrawUnbondedAmount?: string;
  validatorStash?: string | undefined;
  validators?: string[] | undefined;
};

export function isPolkadotOperationExtraRaw(
  op: OperationExtraRaw,
): op is PolkadotOperationExtraRaw {
  return op !== null && typeof op === "object" && "palletMethod" in op;
}

// @flow
import type { BigNumber } from "bignumber.js";
import type {
  TransactionCommon,
  TransactionCommonRaw,
} from "../../types/transaction";

export type RewardDestinationType = "Staked" | "Stash" | "Account" | "Controller"

export type CoreStatics = {};

export type CoreAccountSpecifics = {};

export type CoreOperationSpecifics = {};

export type CoreCurrencySpecifics = {};

export type PolkadotNominationStatus = "active" | "inactive" | "waiting" | null;

export type PolkadotNomination = {|
  address: string,
  value: BigNumber,
  status: PolkadotNominationStatus,
|};

export type PolkadotNominationRaw = {|
  address: string,
  value: string,
  status: PolkadotNominationStatus,
|};

export type PolkadotUnlocking = {|
  amount: BigNumber,
  completionDate: Date,
|};

export type PolkadotUnlockingRaw = {|
  amount: string,
  completionDate: string,
|};

export type PolkadotResources = {|
  controller: ?string,
  stash: ?string,
  nonce: number,
  lockedBalance: BigNumber,
  unlockedBalance: BigNumber,
  unlockingBalance: BigNumber,
  unlockings: ?PolkadotUnlocking[],
  nominations: ?PolkadotNomination[],
  numSlashingSpans: number,
|};

export type PolkadotResourcesRaw = {|
  controller: ?string,
  stash: ?string,
  nonce: number,
  lockedBalance: string,
  unlockedBalance: string,
  unlockingBalance: string,
  unlockings: ?PolkadotUnlockingRaw[],
  nominations: ?PolkadotNominationRaw[],
  numSlashingSpans: number,
|};

export type Transaction = {|
  ...TransactionCommon,
  mode: string,
  family: "polkadot",
  fees: ?BigNumber,
  validators: ?string[],
  era: ?string,
  rewardDestination: ?string,
  numSlashingSpans: ?number,
|};

export type TransactionRaw = {|
  ...TransactionCommonRaw,
  family: "polkadot",
  mode: string,
  fees: ?string,
  validators: ?string[],
  era: ?string,
  rewardDestination: ?string,
  numSlashingSpans: ?number,
|};

export type PolkadotValidator = {|
  address: string,
  identity: string,
  nominatorsCount: number,
  rewardPoints: BigNumber | null,
  commission: BigNumber,
  totalBonded: BigNumber,
  selfBonded: BigNumber,
  isElected: boolean,
  isOversubscribed: boolean,
|};

export type PolkadotNominationInfo = string;

export type PolkadotStakingProgress = {|
  activeEra: number,
  electionClosed: boolean,
  maxNominatorRewardedPerValidator: number,
  bondingDuration: number,
|};

export type PolkadotPreloadData = {|
  validators: PolkadotValidator[],
  staking: PolkadotStakingProgress | null,
|};

export type PolkadotSearchFilter = (
  query: string
) => (validator: PolkadotValidator) => boolean;

export const reflect = (_declare: *) => {};
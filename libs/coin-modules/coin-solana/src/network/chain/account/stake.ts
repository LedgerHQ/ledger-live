/* eslint-disable @typescript-eslint/no-redeclare */

import { Infer, number, nullable, enums, type } from "superstruct";
import { BigNumFromNumber, BigNumFromString } from "../validators/bignum";
import { PublicKeyFromString } from "../validators/pubkey";

export type StakeAccountType = Infer<typeof StakeAccountType>;
export const StakeAccountType = enums(["uninitialized", "initialized", "delegated", "rewardsPool"]);

export type StakeMeta = Infer<typeof StakeMeta>;
export const StakeMeta = type({
  rentExemptReserve: BigNumFromString,
  authorized: type({
    staker: PublicKeyFromString,
    withdrawer: PublicKeyFromString,
  }),
  lockup: type({
    unixTimestamp: number(),
    epoch: number(),
    custodian: PublicKeyFromString,
  }),
});

export const Delegation = type({
  voter: PublicKeyFromString,
  stake: BigNumFromString,
  activationEpoch: BigNumFromString,
  deactivationEpoch: BigNumFromString,
  warmupCooldownRate: number(),
});
export type Delegation = Infer<typeof Delegation>;

export const StakeHistoryEntry = type({
  epoch: BigNumFromNumber,
  effective: BigNumFromNumber,
  activating: BigNumFromNumber,
  deactivating: BigNumFromNumber,
});
export type StakeHistoryEntry = Infer<typeof StakeHistoryEntry>;

export type StakeAccountInfo = Infer<typeof StakeAccountInfo>;
export const StakeAccountInfo = type({
  meta: StakeMeta,
  stake: nullable(
    type({
      delegation: Delegation,
      creditsObserved: number(),
    }),
  ),
});

export type StakeAccount = Infer<typeof StakeAccount>;
export const StakeAccount = type({
  type: StakeAccountType,
  info: StakeAccountInfo,
});

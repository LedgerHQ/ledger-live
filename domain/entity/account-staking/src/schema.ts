import { z } from "zod";
import { AmountStrSchema } from "@domain/entity-account-balance";
import { AccountUUIDSchema } from "@domain/entity-account-descriptor";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";

/** Where a position stands, as the coin module `StakeState`. */
export const StakingPositionStateSchema = z.enum([
  /** Funded, but earning no reward. */
  "inactive",
  /** Earns rewards from the next epoch. */
  "activating",
  /** Earns rewards. */
  "active",
  /** Unbonding: locked until `unlockAt`. */
  "deactivating",
  /** Unbonded: the chain needs a `withdraw` to release it. */
  "withdrawable",
]);

export type StakingPositionState = z.infer<typeof StakingPositionStateSchema>;

/** What the account can do on a position, as the coin module `StakeAction`. */
export const StakingActionSchema = z.enum([
  "delegate",
  "redelegate",
  "undelegate",
  "claim_reward",
  "withdraw",
]);

export type StakingAction = z.infer<typeof StakingActionSchema>;

/** One delegation, stake or unbonding of the account, modelled on the coin module `Stake`. */
export const AccountStakingPositionSchema = z.object({
  /** Unique among the positions of the account. */
  id: z.string().min(1),
  /** The staked asset: the account's native coin, or one of its tokens. */
  assetId: CryptoOrTokenCurrencyIdSchema,
  /** The validator, pool or delegate address; absent when the chain has none. */
  validatorId: z.string().min(1).optional(),
  /** The validators one stake backs together (Polkadot nominations); `validatorId` names a single one. */
  validatorIds: z.array(z.string().min(1)).min(1).optional(),
  state: StakingPositionStateSchema,
  /** What the position holds, in the asset's smallest unit. */
  amount: AmountStrSchema,
  /** The votes cast, where the chain counts votes apart from `amount` (Tron: `amount` is the voted power in sun). */
  votes: AmountStrSchema.optional(),
  /** Rewards earned: part of `amount` when the chain compounds them (`amount = deposited + rewards`), to claim apart otherwise (Cosmos). */
  rewards: AmountStrSchema.optional(),
  /** The part of `amount` that was deposited. */
  deposited: AmountStrSchema.optional(),
  /** When a deactivating position unlocks. */
  unlockAt: z.iso.datetime({ offset: true }).optional(),
  /** Absent when the source does not tell. */
  actions: z.array(StakingActionSchema).optional(),
  /** Set on the delegation a pending redelegation moved stake to: it cannot be redelegated again until `completesAt`. */
  redelegatingFrom: z
    .object({
      validatorId: z.string().min(1),
      completesAt: z.iso.datetime({ offset: true }).optional(),
    })
    .optional(),
});

export type AccountStakingPosition = z.infer<typeof AccountStakingPositionSchema>;

/** Rewards claimable account-wide, not earned by one position (Tron). */
export const AccountStakingRewardSchema = z.object({
  assetId: CryptoOrTokenCurrencyIdSchema,
  amount: AmountStrSchema,
});

export type AccountStakingReward = z.infer<typeof AccountStakingRewardSchema>;

export const AccountStakingSchema = z.object({
  /** Empty for an account that does not stake, or whose family stakes another way. */
  positions: z.array(AccountStakingPositionSchema),
  /** Absent when every reward rides on its position. */
  rewards: z.array(AccountStakingRewardSchema).optional(),
});

export type AccountStaking = z.infer<typeof AccountStakingSchema>;

export const AccountStakingEntrySchema = z.object({
  revision: z.number(),
  staking: AccountStakingSchema,
});

export type AccountStakingEntry = z.infer<typeof AccountStakingEntrySchema>;

export const AccountStakingStateSchema = z.partialRecord(
  AccountUUIDSchema,
  AccountStakingEntrySchema,
);

export type AccountStakingState = z.infer<typeof AccountStakingStateSchema>;

export const initialAccountStakingState: AccountStakingState = {};

/** Per asset, summed over its positions: integer strings in the asset's smallest unit. */
export const StakingTotalsSchema = z.object({
  assetId: CryptoOrTokenCurrencyIdSchema,
  /** Active and activating. */
  staked: AmountStrSchema,
  /** Deactivating. */
  unbonding: AmountStrSchema,
  withdrawable: AmountStrSchema,
  /** The `rewards` of every position, plus the account-wide ones. */
  rewards: AmountStrSchema,
});

export type StakingTotals = z.infer<typeof StakingTotalsSchema>;

declare module "@domain/entity-account-data" {
  interface AccountDataRegistry {
    staking: { query: undefined; result: AccountStaking };
  }
}

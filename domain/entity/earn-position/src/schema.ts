import { z } from "zod";
import { DateTimeIsoSchema, HttpUrlSchema, NonEmptyStringSchema } from "@shared/schema-primitives";

/** Lifecycle of a staking position, as the Earn backend reports it. */
export const EarnPositionStatusSchema = z.enum([
  "activated",
  "activating",
  "deactivating",
  "deactivated",
  "archived",
  "unknown",
]);

/**
 * An amount in the smallest unit of its currency (lamports for SOL), as a digit string. A number is
 * accepted only while it is a safe integer: past 2^53 it has already lost digits.
 */
export const BaseUnitAmountSchema = z
  .union([
    z.string().regex(/^\d+$/, "Expected a non-negative integer"),
    z.int().nonnegative().transform(String),
  ])
  .brand<"BaseUnitAmount">();

/** A yearly rate as a finite fraction between 0 and 1: 0.072 is 7.2%. */
export const ApyFractionSchema = z.number().min(0).max(1).brand<"ApyFraction">();

/** The address of the position's stake account: one position per stake account. */
export const EarnPositionIdSchema = z.string().trim().min(1).brand<"EarnPositionId">();

export const EarnPositionSchema = z.object({
  id: EarnPositionIdSchema,
  network: NonEmptyStringSchema,
  ownerAddress: NonEmptyStringSchema,
  /** The validator's vote account. Empty while the stake account is not delegated. */
  validatorAddress: z.string(),
  validatorName: NonEmptyStringSchema.optional(),
  validatorLogoUrl: HttpUrlSchema.optional(),
  status: EarnPositionStatusSchema,
  balance: BaseUnitAmountSchema.optional(),
  /** The initial deposit, rewards excluded. Never derived from the balance and the rewards. */
  deposited: BaseUnitAmountSchema.optional(),
  totalRewards: BaseUnitAmountSchema.optional(),
  /** The reward rate of this position, not the APY of its validator. */
  positionApy: ApyFractionSchema.optional(),
  updatedAt: DateTimeIsoSchema.optional(),
});

/** A failure a provider reported for the address, in place of the positions it serves. */
export const EarnPositionsFailureSchema = z.object({
  code: z.number(),
  reason: z.string(),
});

/**
 * The positions of one address. No position and no failure: the address holds none. A failure: a
 * provider could not read some of them, so a position missing from `positions` may still exist.
 */
export const EarnPositionsSchema = z.object({
  positions: z.array(EarnPositionSchema),
  failures: z.array(EarnPositionsFailureSchema),
  /**
   * Some rows were missing or past their time to live when the backend read them; it refreshes them
   * after answering. It does not tell whether the chain changed since.
   */
  isStale: z.boolean(),
  respondedAt: DateTimeIsoSchema.optional(),
});

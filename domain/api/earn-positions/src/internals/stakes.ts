import { z } from "zod";
import {
  ApyFractionSchema,
  EarnPositionIdSchema,
  EarnPositionSchema,
  EarnPositionStatusSchema,
  EarnPositionsSchema,
  type ApyFraction,
  type BaseUnitAmount,
  type EarnPosition,
  type EarnPositionStatus,
  type EarnPositions,
  type EarnPositionsFailure,
} from "@domain/entity-earn-position";
import type { GetEarnPositionsArgs } from "../types";

// The wire contract of `POST /v3/stakes` (Earn OpenAPI `StakesV3Response`) and its mapping to the
// entity. Every wire field name lives in this file. Only what identifies a row is strict: a SOL row
// without its stake account fails the whole response. A displayed value that cannot be read becomes
// undefined, so the modal hides its row instead of showing a wrong figure.

const SOLANA_DETAILS = "SolanaDetailsView";

const { shape } = EarnPositionSchema;

const FailureWireSchema = z.object({ code: z.number(), reason: z.string() });

const NetworkAndAddressWireSchema = z.object({
  network: shape.network,
  address: shape.ownerAddress,
});

const SolanaDetailsWireSchema = z.object({
  type: z.literal(SOLANA_DETAILS),
  stake_account: EarnPositionIdSchema,
  validator_address: z.string().nullish(),
  updated_at: z.unknown().optional(),
  // Placeholder name: the backend has yet to add the deposited amount.
  deposited_balance: z.unknown().optional(),
});

const SolanaStakeWireSchema = z.object({
  currency: z.string(),
  status: z.string(),
  protocol_name: z.unknown().optional(),
  logo: z.unknown().optional(),
  staked_balance: z.unknown().optional(),
  rewards: z.unknown().optional(),
  interest: z.unknown().optional(),
  details: SolanaDetailsWireSchema,
});

const StakeFailureWireSchema = z.object({ error: FailureWireSchema });

function isSolanaDetails(details: unknown): boolean {
  return (
    typeof details === "object" &&
    details !== null &&
    "type" in details &&
    details.type === SOLANA_DETAILS
  );
}

/** A stake of another provider or currency, which this use case does not read. */
const OtherStakeWireSchema = z
  .looseObject({ details: z.unknown().optional() })
  .refine(stake => !("error" in stake) && !isSolanaDetails(stake.details));

const StakeWireSchema = z.union([
  StakeFailureWireSchema,
  SolanaStakeWireSchema,
  OtherStakeWireSchema,
]);

const BatchedViewWireSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("BatchStakeViewV1"),
    id: NetworkAndAddressWireSchema,
    stake: StakeWireSchema,
  }),
  z.object({
    type: z.literal("BatchedErrorView"),
    id: NetworkAndAddressWireSchema,
    error: FailureWireSchema,
  }),
]);

export const StakesV3WireSchema = z.object({
  data: z.array(BatchedViewWireSchema).nullish(),
  meta: z.object({ is_stale: z.boolean(), responded_at: z.unknown().optional() }),
});

export type StakesV3Wire = z.infer<typeof StakesV3WireSchema>;

type StakeWire = z.infer<typeof StakeWireSchema>;
type SolanaStakeWire = z.infer<typeof SolanaStakeWireSchema>;
type StakeFailureWire = z.infer<typeof StakeFailureWireSchema>;
type NetworkAndAddressWire = z.infer<typeof NetworkAndAddressWireSchema>;

function isStakeFailure(stake: StakeWire): stake is StakeFailureWire {
  return "error" in stake;
}

function isSolanaStake(stake: StakeWire): stake is SolanaStakeWire {
  return !isStakeFailure(stake) && isSolanaDetails(stake.details);
}

const InterestWireSchema = z.object({ value: z.union([z.string(), z.number()]) });

const TokensRewardsWireSchema = z.object({ currency: z.string(), total: z.unknown().optional() });

const DECIMAL = /^\d+(\.\d+)?$/;

/** `interest.value` is the rate of the position as a fraction, sent as a decimal string. */
function positionApyOf(interest: unknown): ApyFraction | undefined {
  const value = InterestWireSchema.safeParse(interest).data?.value;
  const rate = typeof value === "string" && DECIMAL.test(value) ? Number(value) : value;
  return ApyFractionSchema.safeParse(rate).data;
}

/** The rewards earned in the currency of the stake. Points and failed entries carry none. */
function totalRewardsOf(rewards: unknown, currency: string): BaseUnitAmount | undefined {
  if (!Array.isArray(rewards)) return undefined;
  const earned = rewards
    .map(reward => TokensRewardsWireSchema.safeParse(reward).data)
    .find(reward => reward?.currency === currency);
  return shape.totalRewards.safeParse(earned?.total).data;
}

/** A status this version does not know reads as `unknown`. */
function statusOf(status: string): EarnPositionStatus {
  return EarnPositionStatusSchema.safeParse(status).data ?? "unknown";
}

function toEarnPosition(stake: SolanaStakeWire, owner: NetworkAndAddressWire): EarnPosition {
  const { details } = stake;
  return {
    id: details.stake_account,
    network: owner.network,
    ownerAddress: owner.address,
    validatorAddress: details.validator_address ?? "",
    validatorName: shape.validatorName.safeParse(stake.protocol_name).data,
    validatorLogoUrl: shape.validatorLogoUrl.safeParse(stake.logo).data,
    status: statusOf(stake.status),
    balance: shape.balance.safeParse(stake.staked_balance).data,
    deposited: shape.deposited.safeParse(details.deposited_balance).data,
    totalRewards: totalRewardsOf(stake.rewards, stake.currency),
    positionApy: positionApyOf(stake.interest),
    updatedAt: shape.updatedAt.safeParse(details.updated_at).data,
  };
}

/**
 * The SOL stake accounts of the requested address, and the failures its providers reported. Rows of
 * another address or of another kind are left out.
 */
export function toEarnPositions(
  wire: StakesV3Wire,
  { network, address }: GetEarnPositionsArgs,
): EarnPositions {
  const positions: EarnPosition[] = [];
  const failures: EarnPositionsFailure[] = [];
  for (const view of wire.data ?? []) {
    if (view.id.network !== network || view.id.address !== address) continue;
    if (view.type === "BatchedErrorView") {
      failures.push(view.error);
    } else if (isStakeFailure(view.stake)) {
      failures.push(view.stake.error);
    } else if (isSolanaStake(view.stake)) {
      positions.push(toEarnPosition(view.stake, view.id));
    }
  }
  return {
    positions,
    failures,
    isStale: wire.meta.is_stale,
    respondedAt: EarnPositionsSchema.shape.respondedAt.safeParse(wire.meta.responded_at).data,
  };
}

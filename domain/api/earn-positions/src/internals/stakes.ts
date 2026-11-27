import { z } from "zod";
import {
  EarnPositionIdSchema,
  EarnPositionInterestSchema,
  EarnPositionSchema,
  EarnPositionStatusSchema,
  EarnPositionsSchema,
  type BaseUnitAmount,
  type EarnPosition,
  type EarnPositionInterest,
  type EarnPositionStatus,
  type EarnPositions,
  type EarnPositionsFailure,
} from "@domain/entity-earn-position";
import type { GetEarnPositionsArgs } from "../types";

// The wire contract of `POST /v3/stakes` (Earn OpenAPI `StakesV3Response`) and its mapping to the
// entity. Every wire field name lives in this file. Only the envelope is strict: each row is read on
// its own, and a row of the requested address that cannot be read becomes a failure, so a position
// it may hold reads as an error, never as "no position". A displayed value that cannot be read
// becomes undefined, so the modal hides its row instead of showing a wrong figure.

const SOLANA_DETAILS = "SolanaDetailsView";

/** A row of the requested address that breaks the contract: the position it holds may exist. */
export const UNREADABLE_ROW_FAILURE: EarnPositionsFailure = {
  code: 0,
  reason: "Unreadable stakes row",
};

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

/** A stake of another provider or currency, named by the type of its details: not read here. */
const OtherStakeWireSchema = z
  .looseObject({ details: z.looseObject({ type: z.string() }) })
  .refine(stake => !("error" in stake) && stake.details.type !== SOLANA_DETAILS);

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

const RowOwnerWireSchema = z.looseObject({ id: NetworkAndAddressWireSchema });

/** The envelope. `data` may be absent, never null; its rows are read one by one. */
export const StakesV3WireSchema = z.object({
  data: z.array(z.unknown()).optional(),
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
  return !isStakeFailure(stake) && stake.details.type === SOLANA_DETAILS;
}

const InterestWireSchema = z.object({
  type: z.string(),
  value: z.union([z.string(), z.number()]),
});

const TokensRewardsWireSchema = z.object({ currency: z.string(), total: z.unknown().optional() });

const DECIMAL = /^\d+(\.\d+)?$/;

/** `interest` is the rate of the position and its kind; the value is a fraction, sent as a string. */
function interestOf(interest: unknown): EarnPositionInterest | undefined {
  const wire = InterestWireSchema.safeParse(interest).data;
  if (wire === undefined) return undefined;
  const value =
    typeof wire.value === "string" && DECIMAL.test(wire.value) ? Number(wire.value) : wire.value;
  return EarnPositionInterestSchema.safeParse({ type: wire.type, value }).data;
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
    interest: interestOf(stake.interest),
    updatedAt: shape.updatedAt.safeParse(details.updated_at).data,
  };
}

type RowReading = EarnPosition | EarnPositionsFailure | null;

/**
 * One row of the response: a position, a failure, or nothing for a row of another address or of
 * another kind. A row whose owner cannot be read may be the requested address's, so it fails.
 */
function readRow(row: unknown, { network, address }: GetEarnPositionsArgs): RowReading {
  const owner = RowOwnerWireSchema.safeParse(row).data?.id;
  if (owner && (owner.network !== network || owner.address !== address)) return null;

  const view = BatchedViewWireSchema.safeParse(row).data;
  if (view === undefined) return UNREADABLE_ROW_FAILURE;
  if (view.type === "BatchedErrorView") return view.error;
  if (isStakeFailure(view.stake)) return view.stake.error;
  if (!isSolanaStake(view.stake)) return null;
  // A stake account holds the currency of its network: another one would read in the wrong unit.
  if (view.stake.currency !== network) return UNREADABLE_ROW_FAILURE;
  return toEarnPosition(view.stake, view.id);
}

function isPosition(reading: EarnPosition | EarnPositionsFailure): reading is EarnPosition {
  return "id" in reading;
}

/**
 * The SOL stake accounts of the requested address, and the failures its providers reported or its
 * rows that could not be read. Rows of another address or of another kind are left out.
 */
export function toEarnPositions(wire: StakesV3Wire, args: GetEarnPositionsArgs): EarnPositions {
  const positions: EarnPosition[] = [];
  const failures: EarnPositionsFailure[] = [];
  for (const row of wire.data ?? []) {
    const reading = readRow(row, args);
    if (reading === null) continue;
    if (isPosition(reading)) positions.push(reading);
    else failures.push(reading);
  }
  return {
    positions,
    failures,
    isStale: wire.meta.is_stale,
    respondedAt: EarnPositionsSchema.shape.respondedAt.safeParse(wire.meta.responded_at).data,
  };
}

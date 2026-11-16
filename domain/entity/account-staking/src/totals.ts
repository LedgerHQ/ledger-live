import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import {
  StakingTotalsSchema,
  type AccountStakingPosition,
  type StakingPositionState,
  type StakingTotals,
} from "./schema";

const bucketOf: Record<StakingPositionState, "staked" | "unbonding" | "withdrawable" | undefined> =
  {
    inactive: undefined,
    activating: "staked",
    active: "staked",
    deactivating: "unbonding",
    withdrawable: "withdrawable",
  };

type Sums = { staked: bigint; unbonding: bigint; withdrawable: bigint; rewards: bigint };

/** Per asset, in the order its first position comes: what is staked, unbonding, withdrawable, and the rewards. */
export function stakingTotals(positions: readonly AccountStakingPosition[]): StakingTotals[] {
  const sums = new Map<CryptoOrTokenCurrencyId, Sums>();
  for (const { assetId, state, amount, rewards } of positions) {
    const sum = sums.get(assetId) ?? { staked: 0n, unbonding: 0n, withdrawable: 0n, rewards: 0n };
    const bucket = bucketOf[state];
    if (bucket) sum[bucket] += BigInt(amount);
    if (rewards) sum.rewards += BigInt(rewards);
    sums.set(assetId, sum);
  }
  return [...sums].map(([assetId, sum]) =>
    StakingTotalsSchema.parse({
      assetId,
      staked: sum.staked.toString(),
      unbonding: sum.unbonding.toString(),
      withdrawable: sum.withdrawable.toString(),
      rewards: sum.rewards.toString(),
    }),
  );
}

/** The totals of one asset, zero when it has no position. */
export function assetStakingTotals(
  positions: readonly AccountStakingPosition[],
  assetId: CryptoOrTokenCurrencyId,
): StakingTotals {
  const [totals] = stakingTotals(positions.filter(position => position.assetId === assetId));
  return (
    totals ??
    StakingTotalsSchema.parse({
      assetId,
      staked: "0",
      unbonding: "0",
      withdrawable: "0",
      rewards: "0",
    })
  );
}

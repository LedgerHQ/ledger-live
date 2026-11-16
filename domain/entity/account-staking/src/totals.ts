import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import {
  StakingTotalsSchema,
  type AccountStaking,
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

const zero = (): Sums => ({ staked: 0n, unbonding: 0n, withdrawable: 0n, rewards: 0n });

/** Per asset, positions first then account-wide rewards, in order: what is staked, unbonding, withdrawable, and the rewards. */
export function stakingTotals({
  positions,
  rewards: accountRewards = [],
}: AccountStaking): StakingTotals[] {
  const sums = new Map<CryptoOrTokenCurrencyId, Sums>();
  for (const { assetId, state, amount, rewards } of positions) {
    const sum = sums.get(assetId) ?? zero();
    const bucket = bucketOf[state];
    if (bucket) sum[bucket] += BigInt(amount);
    if (rewards) sum.rewards += BigInt(rewards);
    sums.set(assetId, sum);
  }
  for (const { assetId, amount } of accountRewards) {
    const sum = sums.get(assetId) ?? zero();
    sum.rewards += BigInt(amount);
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

/** The totals of one asset, zero when it has neither position nor reward. */
export function assetStakingTotals(
  { positions, rewards }: AccountStaking,
  assetId: CryptoOrTokenCurrencyId,
): StakingTotals {
  const [totals] = stakingTotals({
    positions: positions.filter(position => position.assetId === assetId),
    rewards: rewards?.filter(reward => reward.assetId === assetId),
  });
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

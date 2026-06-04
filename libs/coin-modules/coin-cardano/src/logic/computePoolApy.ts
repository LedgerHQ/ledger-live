import BigNumber from "bignumber.js";
import { EpochInfo, StakePool } from "../api/api-types";

// Optimal number of pools (protocol constant k); saturation point z0 = 1/k.
const OPTIMAL_POOL_COUNT = 500;
const Z0 = 1 / OPTIMAL_POOL_COUNT;
// Cardano epoch is 5 days.
const EPOCHS_PER_YEAR = 365.25 / 5;

/**
 * Estimate a delegator's yearly APY for a stake pool from the Shelley reward-sharing scheme
 * (ADR-038). Models one epoch's expected rewards and annualises with compounding:
 *
 *   rewardPot = reserves × rho × (1 − tau)                     // epoch rewards available to pools
 *   optimalReward = rewardPot/(1+a0) × (σ' + s'·a0·((σ' − s'·(z0−σ')/z0)/z0))
 *   member share  = max(0, optimalReward − fixedCost) × (1 − margin)
 *   APY           = (1 + memberShare/poolStake)^epochsPerYear − 1
 *
 * where σ' = min(poolStake/totalStake, z0) and s' = min(pledge/totalStake, z0). All amounts are
 * lovelace. Returns 0 for a retired pool, a pool with no stake, or one whose expected reward does
 * not cover its fixed cost — and 0 when reserves/activeStake aren't available (the endpoint does
 * not expose them yet, LIVE-18622), so APY stays omitted until the data lands.
 */
export function computePoolApy(pool: StakePool, epoch: EpochInfo): number {
  if (!epoch.reserves || !epoch.activeStake) return 0;
  if (pool.retiredEpoch !== undefined && pool.retiredEpoch <= epoch.number) return 0;

  const totalStake = new BigNumber(epoch.activeStake);
  const poolStake = new BigNumber(pool.liveStake);
  if (totalStake.lte(0) || poolStake.lte(0)) return 0;

  const { a0, rho, tau } = epoch.params;
  const rewardPot = new BigNumber(epoch.reserves).times(rho).times(1 - tau);

  const sigmaPrime = Math.min(poolStake.div(totalStake).toNumber(), Z0);
  const sPrime = Math.min(new BigNumber(pool.pledge).div(totalStake).toNumber(), Z0);

  const pledgeTerm = sPrime * a0 * ((sigmaPrime - (sPrime * (Z0 - sigmaPrime)) / Z0) / Z0);
  const optimalReward = rewardPot.times((sigmaPrime + pledgeTerm) / (1 + a0));

  const distributable = optimalReward.minus(pool.cost);
  if (distributable.lte(0)) return 0;

  // margin is a percentage string from the pool list (e.g. "3.00" = 3%); clamp to [0,1] and
  // treat an unparseable value as 0 rather than letting NaN poison the APY.
  const rawMargin = Number(pool.margin);
  const margin = Number.isFinite(rawMargin) ? Math.min(Math.max(rawMargin / 100, 0), 1) : 0;
  const memberRewards = distributable.times(1 - margin);

  const perEpochRate = memberRewards.div(poolStake).toNumber();
  return (1 + perEpochRate) ** EPOCHS_PER_YEAR - 1;
}

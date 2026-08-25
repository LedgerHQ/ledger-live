import BigNumber from "bignumber.js";
import {
  ANNUAL_INFLATION_RATE,
  MAX_VALIDATOR_STAKE_SHARE,
  MICROCREDITS_PER_CREDIT,
  MIN_STAKE_AMOUNT,
} from "../constants";
import type { AleoTotalSupplyResponse } from "../types/api";

/**
 * `latest/totalSupply` is untrusted JSON served as a bare scalar, in **credits**.
 * Returns null rather than a bogus BigNumber so callers can fall back to "no rate"
 * instead of rendering NaN%.
 */
export function parseTotalSupply(value: unknown): BigNumber | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const parsed = new BigNumber(value as AleoTotalSupplyResponse);

  return parsed.isFinite() && parsed.isGreaterThan(0) ? parsed : null;
}

/**
 * The network-wide gross staking rate, before any validator commission.
 *
 * `(ANNUAL_INFLATION_RATE * totalSupply) / totalStake`, per the delegator's
 * `block_reward * stake / total_stake` share in snarkVM
 * (synthesizer/src/vm/helpers/rewards.rs).
 *
 * @param totalSupplyCredits total circulating supply, in **credits**
 * @param totalStakeMicrocredits committee-wide staked total, in **microcredits**
 * @returns a fraction (0.078 = 7.8%), or null when the inputs cannot yield one
 */
export function estimateGrossRate(
  totalSupplyCredits: BigNumber,
  totalStakeMicrocredits: BigNumber,
): BigNumber | null {
  if (!totalSupplyCredits.isFinite() || totalSupplyCredits.isLessThanOrEqualTo(0)) return null;
  if (!totalStakeMicrocredits.isFinite() || totalStakeMicrocredits.isLessThanOrEqualTo(0)) {
    return null;
  }

  // Both sides onto credits before dividing — mixing the two scales silently
  // inflates the result by 1e6.
  const totalStakeCredits = totalStakeMicrocredits.dividedBy(MICROCREDITS_PER_CREDIT);

  return totalSupplyCredits.multipliedBy(ANNUAL_INFLATION_RATE).dividedBy(totalStakeCredits);
}

/**
 * The rate a delegator can expect from one validator: the gross network rate minus
 * that validator's commission, and zero in the two cases where the protocol pays
 * nothing at all.
 *
 * It is a **lower bound** — the formula drops the coinbase share and transaction
 * fees — so every surface showing it must label it an estimate.
 *
 * @returns a fraction (0.07 = 7%), or null when no rate can be derived. Null means
 *   "unknown", zero means "earns nothing"; they are not interchangeable.
 */
export function estimateNetRate({
  totalSupplyCredits,
  totalStakeMicrocredits,
  validatorStakeMicrocredits,
  commissionPercent,
  delegatorStakeMicrocredits,
}: {
  totalSupplyCredits: BigNumber;
  totalStakeMicrocredits: BigNumber;
  validatorStakeMicrocredits: BigNumber;
  /** Percent, 0-100, straight off the committee tuple. */
  commissionPercent: BigNumber;
  /**
   * The delegator's own position, when evaluating it for a specific account.
   * Omit for the generic per-validator rate shown in a picker.
   */
  delegatorStakeMicrocredits?: BigNumber;
}): BigNumber | null {
  const grossRate = estimateGrossRate(totalSupplyCredits, totalStakeMicrocredits);
  if (grossRate === null) return null;

  if (!commissionPercent.isFinite() || commissionPercent.isLessThan(0)) return null;

  // An over-concentrated validator earns nothing — not the network average.
  const stakeShare = validatorStakeMicrocredits.dividedBy(totalStakeMicrocredits);
  if (stakeShare.isGreaterThan(MAX_VALIDATOR_STAKE_SHARE)) return new BigNumber(0);

  // Neither does a delegator below the protocol minimum.
  if (
    delegatorStakeMicrocredits !== undefined &&
    delegatorStakeMicrocredits.isLessThan(MIN_STAKE_AMOUNT)
  ) {
    return new BigNumber(0);
  }

  // A commission above 100% would otherwise produce a negative rate.
  const keptShare = BigNumber.maximum(new BigNumber(1).minus(commissionPercent.dividedBy(100)), 0);

  return grossRate.multipliedBy(keptShare);
}

/**
 * Pool exchange-rate math used by `getStakesRaw` (per-stake reward) and
 * `getValidators` (per-validator APY). Pure functions — no I/O, no
 * mutation; the JSON→TS shape adapters live in `./mappers.ts`.
 */

export type ExchangeRate = {
  sui_amount: string | number;
  pool_token_amount: string | number;
};

/**
 * Unrealised reward for an Active stake (pool-token model):
 *   tokens = principal × pt_a / sui_a
 *   value  = tokens × sui_c / pt_c
 *   reward = max(0, value − principal)
 * Clamp at 0 absorbs integer-division rounding for very-recent stakes.
 */
export function computeEstimatedReward(
  principal: string | number | bigint,
  activationRate: ExchangeRate,
  currentRate: ExchangeRate,
): bigint {
  const p = typeof principal === "bigint" ? principal : BigInt(principal);
  const sui_a = BigInt(activationRate.sui_amount);
  const pt_a = BigInt(activationRate.pool_token_amount);
  const sui_c = BigInt(currentRate.sui_amount);
  const pt_c = BigInt(currentRate.pool_token_amount);
  if (sui_a === 0n || pt_c === 0n) return 0n;
  const tokens = (p * pt_a) / sui_a;
  const currentValue = (tokens * sui_c) / pt_c;
  return currentValue > p ? currentValue - p : 0n;
}

/**
 * APY mirroring Mysten's `getValidatorsApy`:
 *   APY = (cur_ratio / past_ratio) ^ (epochsPerYear / epochsBetween) − 1
 * SUI epochs ~24h → `epochsPerYear ≈ 365`. Returns 0 for degenerate
 * inputs (zero division, non-positive growth window).
 */
export function computeApy(
  currentRate: ExchangeRate,
  pastRate: ExchangeRate,
  epochsBetween: number,
  epochsPerYear = 365,
): number {
  if (epochsBetween <= 0) return 0;
  const past_sui = BigInt(pastRate.sui_amount);
  const past_pt = BigInt(pastRate.pool_token_amount);
  const cur_sui = BigInt(currentRate.sui_amount);
  const cur_pt = BigInt(currentRate.pool_token_amount);
  if (past_sui === 0n || past_pt === 0n || cur_pt === 0n) return 0;
  // 1e18-scaled BigInt → float (BigInt has no fractional power).
  const SCALE = 10n ** 18n;
  const pastRatioScaled = (past_sui * SCALE) / past_pt;
  const curRatioScaled = (cur_sui * SCALE) / cur_pt;
  if (pastRatioScaled === 0n) return 0;
  const ratio = Number(curRatioScaled) / Number(pastRatioScaled);
  if (!Number.isFinite(ratio) || ratio <= 0) return 0;
  const perEpoch = Math.pow(ratio, 1 / epochsBetween);
  const apy = Math.pow(perEpoch, epochsPerYear) - 1;
  return Number.isFinite(apy) ? Math.max(apy, 0) : 0;
}

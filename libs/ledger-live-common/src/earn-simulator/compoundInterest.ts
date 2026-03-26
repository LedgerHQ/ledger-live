export type YearProjection = {
  year: number;
  deposits: number;
  rewards: number;
};

/**
 * Computes yearly projections of cumulative deposits vs compound rewards.
 *
 * Each year the APY is applied to the full balance (deposits + previously
 * accumulated rewards), so rewards compound over time.
 *
 * @param initialDeposit - Lump sum deposited at year 0
 * @param monthlyDeposit - Amount deposited each month
 * @param apy - Annual percentage yield as a percentage (e.g. 7.32 for 7.32%)
 * @param years - Number of years to project
 */
export function computeProjections(
  initialDeposit: number,
  monthlyDeposit: number,
  apy: number,
  years: number,
): YearProjection[] {
  const rate = apy / 100;
  const projections: YearProjection[] = [];
  let cumulativeRewards = 0;

  for (let y = 1; y <= years; y++) {
    const deposits = initialDeposit + monthlyDeposit * 12 * y;
    const balance = deposits + cumulativeRewards;
    cumulativeRewards += rate * balance;
    projections.push({ year: y, deposits, rewards: Math.round(cumulativeRewards) });
  }

  return projections;
}

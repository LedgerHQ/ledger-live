export type YearProjection = {
  year: number;
  deposits: number;
  rewards: number;
};

/**
 * Computes yearly projections of deposits vs rewards using compound interest
 * with monthly compounding and regular monthly contributions.
 *
 * @param initialDeposit - The initial lump sum deposited at year 0
 * @param monthlyDeposit - The amount deposited each month
 * @param apy - Annual percentage yield as a percentage (e.g. 7.32 for 7.32%)
 * @param years - Number of years to project (generates one entry per year)
 */
export function computeProjections(
  initialDeposit: number,
  monthlyDeposit: number,
  apy: number,
  years: number,
): YearProjection[] {
  const monthlyRate = apy / 100 / 12;
  const projections: YearProjection[] = [];

  for (let y = 1; y <= years; y++) {
    const months = y * 12;
    const totalDeposits = initialDeposit + monthlyDeposit * 12 * y;

    let futureValue: number;
    if (monthlyRate === 0) {
      futureValue = totalDeposits;
    } else {
      const compoundFactor = Math.pow(1 + monthlyRate, months);
      futureValue =
        initialDeposit * compoundFactor + monthlyDeposit * ((compoundFactor - 1) / monthlyRate);
    }

    projections.push({
      year: y,
      deposits: Math.round(totalDeposits),
      rewards: Math.round(Math.max(0, futureValue - totalDeposits)),
    });
  }

  return projections;
}

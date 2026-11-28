import type { CantonContext } from "../config";

const magnitude: bigint = 10n ** 38n;

type FeeTier = {
  limit: bigint | null; // `null` means no upper limit
  rateNumerator: bigint; // e.g., 1 for 1%
  rateDenominator: bigint; // e.g., 100 for 1%
};

const cantonCoinTiers: FeeTier[] = [
  // 100n because of rateDenominator for percentages
  { limit: 100n * 100n * magnitude, rateNumerator: 1n, rateDenominator: 100n }, // 1.0%
  { limit: 1000n * 100n * magnitude, rateNumerator: 1n, rateDenominator: 1000n }, // 0.1%
  { limit: 1_000_000n * 100n * magnitude, rateNumerator: 1n, rateDenominator: 10_000n }, // 0.01%
  { limit: null, rateNumerator: 1n, rateDenominator: 100_000n }, // 0.001%
];

// Add 1 CC as base fee
const tieredFee = (amount: bigint): bigint =>
  magnitude + calculateFeeWithTiers(amount, cantonCoinTiers);

export async function estimateFees(context: CantonContext, amount: bigint): Promise<bigint> {
  const { fee: forcedValue } = await context.config();
  return forcedValue === undefined ? tieredFee(amount) : BigInt(forcedValue) * magnitude;
}

/**
 * The largest amount that fits in the balance with its fee, and that fee.
 * When nothing fits: 0, with a fee above the balance.
 */
export async function estimateSendMax(
  context: CantonContext,
  balance: bigint,
): Promise<{ amount: bigint; fee: bigint }> {
  const { fee: forcedValue } = await context.config();
  if (forcedValue !== undefined) {
    const fee = BigInt(forcedValue) * magnitude;
    return { amount: balance > fee ? balance - fee : 0n, fee };
  }

  // The cost only grows with the amount, so a binary search finds the largest amount that fits.
  const fits = (amount: bigint) => amount + tieredFee(amount) <= balance;
  let amount = 0n;
  let tooMuch = balance + 1n;
  while (tooMuch - amount > 1n) {
    const middle = (amount + tooMuch) / 2n;
    if (fits(middle)) amount = middle;
    else tooMuch = middle;
  }
  return { amount, fee: tieredFee(amount) };
}

function calculateFeeWithTiers(value: bigint, tiers: FeeTier[]): bigint {
  let remaining = value;
  let lastLimit = 0n;
  let fee = 0n;

  for (const tier of tiers) {
    if (remaining <= 0n) break;

    const tierCap = tier.limit === null ? remaining : tier.limit - lastLimit;
    const applicable = remaining < tierCap ? remaining : tierCap;

    fee += (applicable * tier.rateNumerator) / tier.rateDenominator;

    remaining -= applicable;
    lastLimit = tier.limit ?? lastLimit;
  }

  return fee;
}

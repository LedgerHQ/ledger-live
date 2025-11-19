import coinConfig from "../../config";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

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

const feeValue = (currency: CryptoCurrency) => coinConfig.getCoinConfig(currency).fee;

export async function estimateFees(currency: CryptoCurrency, amount: bigint): Promise<bigint> {
  const forcedValue = feeValue(currency);
  if (forcedValue !== undefined) {
    return Promise.resolve(BigInt(forcedValue) * magnitude);
  } else {
    return Promise.resolve(
      // Add 1 CC as base fee
      1n * magnitude + BigInt(calculateFeeWithTiers(amount, cantonCoinTiers)),
    );
  }
}

function calculateFeeWithTiers(value: bigint, tiers: FeeTier[]): bigint {
  let remaining = value;
  let lastLimit = 0n;
  let fee = 0n;

  for (const tier of tiers) {
    if (remaining <= 0n) break;

    const currentLimit = tier.limit ?? BigInt(2 ** 62); // highest bigint value
    const tierCap = currentLimit - lastLimit;
    const applicable = remaining < tierCap ? remaining : tierCap;

    fee += (applicable * tier.rateNumerator) / tier.rateDenominator;

    remaining -= applicable;
    lastLimit = currentLimit;
  }

  return fee;
}

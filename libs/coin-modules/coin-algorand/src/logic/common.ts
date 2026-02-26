export const ALGORAND_MIN_ACCOUNT_BALANCE = 100000n; // 0.1 ALGO in microAlgos

/**
 * Compute minimum balance required for an Algorand account
 * Base: 0.1 ALGO + 0.1 ALGO per asset
 */
export function computeMinimumBalance(nbAssets: number, isOptingIn = false): bigint {
  const base = 100000n; // 0.1 algo = 100000 microalgos
  const newAsset = isOptingIn ? 1n : 0n;
  return base * (1n + BigInt(nbAssets) + newAsset);
}

/**
 * Compute max spendable balance for an Algorand account
 */
export function computeMaxSpendable(balance: bigint, nbAssets: number, isOptingIn = false): bigint {
  const minBalance = computeMinimumBalance(nbAssets, isOptingIn);
  const maxSpendable = balance - minBalance;
  return maxSpendable > 0n ? maxSpendable : 0n;
}

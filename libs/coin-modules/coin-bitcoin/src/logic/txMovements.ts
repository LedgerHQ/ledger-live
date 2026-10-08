/** Amounts per address, in the smallest unit. */
export type Totals = Record<string, bigint>;

/** Sums values per address; entries without an address or a value are skipped. */
export function sumByAddress(
  entries: { address?: string | null; value?: string | null }[],
): Totals {
  const totals: Totals = {};
  for (const { address, value } of entries) {
    if (!address || !value) continue;
    totals[address] = (totals[address] ?? 0n) + BigInt(value);
  }
  return totals;
}

/**
 * Splits `fees` across the senders proportionally to their input totals (floor), the rounding
 * remainder going to the sender with the largest input.
 */
export function feeShares(fees: bigint, inputs: Totals): Totals {
  const shares: Totals = {};
  const entries = Object.entries(inputs);
  const totalIn = entries.reduce((sum, [, value]) => sum + value, 0n);
  if (totalIn === 0n || fees === 0n) return shares;

  let largest = entries[0][0];
  let distributed = 0n;
  for (const [address, value] of entries) {
    const share = (fees * value) / totalIn;
    shares[address] = share;
    distributed += share;
    if (value > inputs[largest]) largest = address;
  }
  shares[largest] += fees - distributed;
  return shares;
}

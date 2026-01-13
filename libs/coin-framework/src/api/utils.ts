import { BalanceDelta } from "./types";

/**
 * In most cases, blockchain API/RPCs return the balance changes for a transaction including the impact of paying fees.
 * In our APIs, we keep fees separate from other balance changes occurring in the same transaction. This function
 * subtracts the fees from the balance changes.
 *
 * An error is thrown if provided deltas do not cover provided fees (eg: no delta for a given fee).
 *
 * @param deltas transaction balance deltas, including fees
 * @param fees fees balance deltas
 * @returns balance transaction deltas excluding fees
 */
export function deduceFees(
  deltas: readonly BalanceDelta[],
  fees: readonly BalanceDelta[],
): BalanceDelta[] {
  const remainingFees = [...fees];
  const remainingDeltas = [...deltas];

  const result: BalanceDelta[] = [];
  while (remainingDeltas.length > 0) {
    const delta = remainingDeltas.pop();
    if (delta === undefined) break;
    const index = remainingFees.findIndex(
      d => d.address === delta.address && d.asset === delta.asset,
    );
    if (index < 0) {
      result.push(delta);
    } else {
      const fee = remainingFees[index];
      remainingDeltas.push({ ...delta, delta: delta.delta - fee.delta });
      remainingFees.splice(index, 1);
    }
  }

  if (remainingFees.length > 0)
    throw new Error(
      `Cannot deduce fees from deltas:\ndeltas: ${JSON.stringify(deltas)}\nfees: ${JSON.stringify(fees)}`,
    );

  return result;
}

import { BigNumber } from "bignumber.js";
import type { SpendableNote, ZcashTransferType } from "./types";

// ZIP-317 constants
export const ZIP317_MARGINAL_FEE = 5_000; // per logical action
export const ZIP317_GRACE_ACTIONS = 2;
/** Minimum fee (grace actions * marginal fee). */
export const ZIP317_MINIMUM_FEE = ZIP317_GRACE_ACTIONS * ZIP317_MARGINAL_FEE; // 10_000
/** Change below this threshold is absorbed into the fee (avoids near-unspendable dust notes).
 * Set to marginal fee: spending a dust note costs at least one action (5k zats). */
const DUST_THRESHOLD = ZIP317_MARGINAL_FEE;
/** Maximum fee iteration rounds before giving up. */
const MAX_ITERATIONS = 5;

/**
 * Compute ZIP-317 fee for a given number of logical actions.
 * fee = max(grace_actions, logical_actions) * marginal_fee
 */
export function computeZip317Fee(logicalActions: number): BigNumber {
  return new BigNumber(Math.max(ZIP317_GRACE_ACTIONS, logicalActions) * ZIP317_MARGINAL_FEE);
}

/**
 * Compute logical action count for a shielded transaction.
 * Each Orchard Action bundles 1 spend + 1 output.
 * nActions = max(spends, outputs) — padded if unequal.
 */
export function computeLogicalActions(
  spendCount: number,
  outputCount: number,
  transferType: ZcashTransferType,
): number {
  if (transferType === "shielded") {
    // All-shielded: max(spends, outputs) Orchard actions
    return Math.max(spendCount, outputCount);
  }
  if (transferType === "shielded-to-transparent") {
    // Transparent output is NOT an Orchard action.
    // Orchard bundle: N spends + at most 1 change output (Orchard).
    // nActions = max(spends, orchard_outputs) where orchard_outputs ∈ {0, 1}.
    // Since spendCount ≥ 1, max(spendCount, 1) = spendCount. Equivalent but explicit.
    return Math.max(spendCount, 1);
  }
  // transparent-to-shielded / transparent: fee is handled by the Bitcoin
  // legacy path (prepareTransaction returns undefined for these types).
  // Returning 0 is defensive — callers never reach here for transparent sources.
  return 0;
}

export type CoinSelectionResult = {
  selectedNotes: SpendableNote[];
  fee: BigNumber;
  changeAmount: BigNumber;
  totalInput: BigNumber;
};

/**
 * Select notes to cover `amount + fee` using largest-first strategy.
 * Fee depends on action count, which depends on selection — resolved iteratively.
 *
 * Returns undefined if insufficient balance.
 */
export function selectNotes(
  spendableNotes: SpendableNote[],
  amount: BigNumber,
  transferType: ZcashTransferType,
): CoinSelectionResult | undefined {
  // Sort largest-first to minimize action count
  const sorted = [...spendableNotes].sort((a, b) => b.amount.comparedTo(a.amount));

  // Iterative fee resolution (converges in <= 3 rounds for practical sizes)
  let fee = computeZip317Fee(ZIP317_GRACE_ACTIONS); // initial estimate: 2-action minimum

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const target = amount.plus(fee);
    let totalInput = new BigNumber(0);
    const selected: SpendableNote[] = [];

    for (const note of sorted) {
      if (totalInput.gte(target)) break;
      selected.push(note);
      totalInput = totalInput.plus(note.amount);
    }

    if (totalInput.lt(target)) return undefined; // Insufficient balance

    let changeAmount = totalInput.minus(amount).minus(fee);

    // Absorb dust change into the fee to avoid creating near-unspendable notes.
    if (changeAmount.gt(0) && changeAmount.lt(DUST_THRESHOLD)) {
      fee = fee.plus(changeAmount);
      changeAmount = new BigNumber(0);
    }

    const hasChange = changeAmount.gt(0);
    const outputCount = hasChange ? 2 : 1; // recipient + optional change
    const spendCount = selected.length;
    const logicalActions = computeLogicalActions(spendCount, outputCount, transferType);
    const newFee = computeZip317Fee(logicalActions);

    if (newFee.lte(fee)) {
      // Fee converged (or dust absorption made fee exceed the computed minimum)
      return { selectedNotes: selected, fee, changeAmount, totalInput };
    }
    fee = newFee; // Retry with updated fee
  }

  // Should not happen — fee is monotonically bounded
  console.warn(
    `[zcash] selectNotes: fee iteration did not converge after ${MAX_ITERATIONS} rounds ` +
    `(amount=${amount.toFixed()}, notes=${spendableNotes.length}, lastFee=${fee.toFixed()})`,
  );
  return undefined;
}

/**
 * Estimate the maximum spendable amount for a given transfer type.
 * = sum(all unspent notes) - fee(spending all notes)
 */
export function estimateMaxSpendableAmount(
  spendableNotes: SpendableNote[],
  transferType: ZcashTransferType,
): BigNumber {
  if (spendableNotes.length === 0) return new BigNumber(0);

  const totalBalance = spendableNotes.reduce((sum, n) => sum.plus(n.amount), new BigNumber(0));

  // Fee for spending ALL notes (1 output = recipient, no change when max)
  const logicalActions = computeLogicalActions(spendableNotes.length, 1, transferType);
  const fee = computeZip317Fee(logicalActions);

  return BigNumber.max(totalBalance.minus(fee), 0);
}

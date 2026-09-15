import { BigNumber } from "bignumber.js";
import type { ZcashTransferType } from "../types/bridge";
import type { SpendableNote } from "../network/types";

// ── ZIP-317 fee model ──────────────────────────────────────────────────────
//
// This MUST stay bit-identical to the native builder's `zip317_fee`
// (ledger-zcash-utils, crates/zcash-crypto/src/craft.rs). `buildTransaction`
// rejects any fee that is not exactly the ZIP-317 fee for the final action
// layout (`fee != required_fee`), so the wallet has to price a transaction the
// same way the builder does. In particular the Orchard pool is floored to
// ORCHARD_MIN_ACTIONS *independently* of the transparent pool before the two
// are summed — a single collapsed `max(grace, in + out)` does not capture that
// and underprices the mixed-pool (Public↔Private) flows.
export const ZIP317_MARGINAL_FEE = 5_000; // per logical action
export const ZIP317_GRACE_ACTIONS = 2;
/** Orchard `BundleType::DEFAULT` pads to at least this many actions (mirrors
 * `ORCHARD_MIN_ACTIONS` / orchard's `MIN_ACTIONS`). Applied only when the
 * Orchard bundle is non-empty. */
export const ORCHARD_MIN_ACTIONS = 2;
/** Minimum fee (grace actions * marginal fee). */
export const ZIP317_MINIMUM_FEE = ZIP317_GRACE_ACTIONS * ZIP317_MARGINAL_FEE; // 10_000
/** Maximum fee iteration rounds before giving up. */
const MAX_ITERATIONS = 5;

/** Minimum non-dust value (zatoshis) for a transparent output: the network
 * rejects a smaller one at broadcast, so the wallet must refuse it up front
 * instead of signing first. Same value for both transparent address kinds. */
export const TRANSPARENT_OUTPUT_DUST_THRESHOLD = 54;

/**
 * ZIP-317 fee in zatoshis for a per-pool action layout. Mirror of
 * `zip317_fee(n_spends, n_orchard_outputs, n_transparent_inputs,
 * n_transparent_outputs)` in the native builder (craft.rs):
 *
 *   orchard_actions     = (n_spends == 0 && n_orchard_outputs == 0)
 *                           ? 0
 *                           : max(ORCHARD_MIN_ACTIONS, max(n_spends, n_orchard_outputs))
 *   transparent_actions = max(n_transparent_inputs, n_transparent_outputs)
 *   fee                 = MARGINAL_FEE * max(GRACE_ACTIONS,
 *                                            transparent_actions + orchard_actions)
 *
 * The two pools are floored independently: whenever an Orchard bundle is present
 * it costs at least 2 actions on top of the transparent leg. Keeping this in one
 * place — identical to the builder — is what prevents the runtime "fee does not
 * satisfy ZIP-317" rejection on mixed-pool sends.
 */
export function computeZip317Fee(
  nSpends: number,
  nOrchardOutputs: number,
  nTransparentInputs: number,
  nTransparentOutputs: number,
): BigNumber {
  const orchardActions =
    nSpends === 0 && nOrchardOutputs === 0
      ? 0
      : Math.max(ORCHARD_MIN_ACTIONS, Math.max(nSpends, nOrchardOutputs));
  const transparentActions = Math.max(nTransparentInputs, nTransparentOutputs);
  const logicalActions = transparentActions + orchardActions;
  return new BigNumber(ZIP317_MARGINAL_FEE * Math.max(ZIP317_GRACE_ACTIONS, logicalActions));
}

/**
 * ZIP-317 fee for a shielded-input send (Ironwood spends), per transfer type.
 *
 *   • "shielded" (Private→Private): the recipient and the optional change note
 *     are both shielded (Ironwood) outputs.
 *   • "shielded-to-transparent" (Private→Public): the recipient is a
 *     transparent output; the optional change stays shielded (an Ironwood note).
 *
 * There is always at least one shielded spend, so the Orchard-family bundle is
 * present and floored to ORCHARD_MIN_ACTIONS even when its output count is 0 or 1
 * (e.g. a shielded→transparent send with no shielded change). This is exactly the
 * floor the collapsed `max(spends, 1)` model dropped.
 */
export function computeShieldedSpendFee(
  spendCount: number,
  hasChange: boolean,
  transferType: ZcashTransferType,
): BigNumber {
  const changeOutputs = hasChange ? 1 : 0;
  return transferType === "shielded-to-transparent"
    ? // transparent recipient (1 t-out) + optional shielded change (Ironwood out)
      computeZip317Fee(spendCount, changeOutputs, 0, 1)
    : // recipient + optional change, both shielded outputs
      computeZip317Fee(spendCount, 1 + changeOutputs, 0, 0);
}

/**
 * ZIP-317 fee for a transparent-to-shielded ("shielding") transaction.
 *
 * Inputs are transparent P2PKH UTXOs; outputs are Orchard notes (the recipient
 * plus an optional shielded change note). No transparent change output is
 * created (`transparent_outputs = 0`); any surplus is taken as an Orchard
 * change note. The Orchard bundle is floored to ORCHARD_MIN_ACTIONS, so the fee
 * is `MARGINAL_FEE * max(GRACE, transparent_in + max(2, orchard_out))` — the
 * per-pool Orchard floor the old `transparent_in + orchard_out` sum omitted.
 */
export function computeShieldingFee(
  transparentInputCount: number,
  orchardOutputCount: number,
): BigNumber {
  return computeZip317Fee(0, orchardOutputCount, transparentInputCount, 0);
}

/**
 * ZIP-317 fee for one round of transparent-input selection, per transfer type.
 *
 * The native PCZT builder owns change creation; the caller-supplied fee must be
 * computed from the same ZIP-317 model, mirroring the on-chain layout of each
 * flow:
 *
 *   • "transparent-to-shielded": transparent inputs are consolidated into
 *     Orchard outputs (no transparent change) — see computeShieldingFee.
 *     `outputCount` is the number of Orchard outputs (recipient + optional
 *     shielded change).
 *   • "transparent" (t→t): inputs and outputs are both transparent with no
 *     Orchard bundle, so logical_actions = max(transparent_in, transparent_out).
 */
export function computeTransparentSelectionFee(
  inputCount: number,
  outputCount: number,
  transferType: ZcashTransferType,
): BigNumber {
  return transferType === "transparent-to-shielded"
    ? computeShieldingFee(inputCount, outputCount)
    : computeZip317Fee(0, 0, inputCount, outputCount);
}

export type TransparentSelectionResult = {
  totalInput: BigNumber;
  fee: BigNumber;
  changeAmount: BigNumber;
};

/**
 * Resolves the fee and change for a transparent-input send (Public→*).
 *
 * All available transparent UTXOs are spent, so there is no UTXO sub-selection
 * — only fee/change resolution. The fee model depends on `transferType`:
 * "transparent-to-shielded" consolidates the inputs into Orchard outputs, while
 * "transparent" (t→t) keeps them transparent (see computeTransparentSelectionFee).
 * Returns undefined when the balance cannot cover amount + fee.
 */
export function selectTransparentInputs(
  utxoValues: BigNumber[],
  amount: BigNumber,
  useAllAmount: boolean,
  transferType: ZcashTransferType,
): TransparentSelectionResult | undefined {
  if (utxoValues.length === 0) return undefined;
  const totalInput = utxoValues.reduce((sum, v) => sum.plus(v), new BigNumber(0));
  const inputCount = utxoValues.length;

  if (useAllAmount) {
    // Single recipient output, no change.
    const fee = computeTransparentSelectionFee(inputCount, 1, transferType);
    if (totalInput.minus(fee).lte(0)) return undefined;
    return { totalInput, fee, changeAmount: new BigNumber(0) };
  }

  // Assume a change output (recipient + change = 2 outputs).
  const fee = computeTransparentSelectionFee(inputCount, 2, transferType);
  const changeAmount = totalInput.minus(amount).minus(fee);

  // Dropping the change output would not make an unaffordable amount affordable:
  // for both transfer types this function serves the 1- and 2-output fees are
  // identical -- "transparent" is floored by the grace actions
  // (`max(GRACE, max(in, out))`) and "transparent-to-shielded" by the Orchard
  // minimum (`max(ORCHARD_MIN, out)`, equal for out of 1 or 2). So there is no
  // single-output retry to attempt, and no remainder that could end up without a
  // change output to hold it. `computeTransparentSelectionFee`'s own tests pin
  // that equality, so a future fee-model change that breaks it fails loudly here.
  if (changeAmount.lt(0)) return undefined; // insufficient balance

  // The native PCZT builder owns change creation for every transfer type this
  // function serves -- "transparent" (t→t) on the V5 builder and
  // "transparent-to-shielded" on the strict Ironwood (V6) builder alike -- and
  // both require the fee to equal the ZIP-317 fee *exactly*. Any leftover below
  // one action's worth stays as change; it must never be folded into the fee.
  return { totalInput, fee, changeAmount };
}

/**
 * Estimates the maximum spendable amount for a transparent-input send:
 * = sum(all transparent UTXOs) - fee(spend all UTXOs, single recipient output).
 * The fee model depends on `transferType` (see computeTransparentSelectionFee).
 */
export function estimateMaxSpendableTransparent(
  utxoValues: BigNumber[],
  transferType: ZcashTransferType,
): BigNumber {
  if (utxoValues.length === 0) return new BigNumber(0);
  const total = utxoValues.reduce((sum, v) => sum.plus(v), new BigNumber(0));
  const fee = computeTransparentSelectionFee(utxoValues.length, 1, transferType);
  return BigNumber.max(total.minus(fee), 0);
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
  let fee = new BigNumber(ZIP317_MINIMUM_FEE); // initial estimate: 2-action minimum

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

    // The native PCZT builder owns change creation and requires the fee to
    // equal the ZIP-317 fee *exactly* for every Ironwood-bundle flow
    // ("shielded", "shielded-to-transparent") -- any leftover below one
    // action's worth stays as a change note; it must never be folded into
    // the fee.
    const changeAmount = totalInput.minus(amount).minus(fee);

    const hasChange = changeAmount.gt(0);
    const spendCount = selected.length;
    const newFee = computeShieldedSpendFee(spendCount, hasChange, transferType);

    if (newFee.lte(fee)) {
      // Fee converged: the layout priced at `fee` needs no more than `fee`.
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

  // Fee for spending ALL notes into a single recipient output (no change).
  const fee = computeShieldedSpendFee(spendableNotes.length, false, transferType);

  return BigNumber.max(totalBalance.minus(fee), 0);
}

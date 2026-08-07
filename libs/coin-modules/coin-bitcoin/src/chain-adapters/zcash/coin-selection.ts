import { BigNumber } from "bignumber.js";

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

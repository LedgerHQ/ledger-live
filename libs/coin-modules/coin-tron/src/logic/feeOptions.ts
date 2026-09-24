import type { FeeOptionMeta, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { type TronContext } from "../config";
import type { TronMemo, TronTxData } from "../types";
import {
  STANDARD_FEE_OPTION_ID,
  TRONIFY_FEE_OPTION_ID,
  TRX_CURRENCY_NAME,
  TRX_UNIT,
} from "./constants";
import { estimateFees } from "./estimateFees";
import { validateAddress } from "./validateAddress";

type TronIntent = TransactionIntent<TronMemo, TronTxData>;

// Both fee options are paid in native TRX — Tronify quotes are TRX-denominated (estimateTronifyFees
// rejects any non-TRX quote) — so the fee asset is identical for each; the id is what distinguishes
// them. A fresh feeAsset (and unit clone) per call keeps returned options free of shared mutable
// state — mutating an option must never leak into the module-level `TRX_UNIT` constant.
const feeOption = (id: string): FeeOptionMeta => ({
  id,
  feeAsset: { type: "native", name: TRX_CURRENCY_NAME, unit: { ...TRX_UNIT } },
});

// Fresh array per call so a caller can't mutate a shared module-level list.
const standardOnly = (): FeeOptionMeta[] => [feeOption(STANDARD_FEE_OPTION_ID)];

/**
 * List the fee-payment options available for an intent (ADR-050 Option 3) — availability metadata
 * only, no amounts. The Tronify energy-rent option is offered alongside the standard TRX burn only
 * when all of the following hold:
 *   - the intent is a TRC-20 transfer (Tronify covers nothing else — never native or TRC-10 sends),
 *   - the Tronify provider is activated in remote coin-config (its `energyRent` block is present),
 *   - the standard path would actually burn TRX (the sender lacks the staked energy/bandwidth to
 *     send for free — otherwise Tronify saves nothing).
 *
 * Never throws: any failure (unreadable config, a failed energy simulation) degrades to the
 * standard-only list, so the standard path always works (ADR-050 Option 3 AC). Availability is not
 * probed over the network here — the actual Tronify price (and hence its live availability) is
 * fetched later by `estimateFees(intent, "tronify")`, which surfaces any failure explicitly.
 */
export async function listFeeOptions(
  context: TronContext,
  intent: TronIntent,
): Promise<FeeOptionMeta[]> {
  try {
    // Tronify only applies to TRC-20 transfers.
    if (intent.type !== "send" || intent.asset.type !== "trc20") return standardOnly();

    // `prepareTransaction` re-estimates on every change — before a recipient is entered and while the
    // user is still typing. Bail quietly until the recipient is a valid Tron address, so the estimate
    // below never throws decoding a malformed base58 (repeated try/catch + wasted estimates each keystroke).
    if (!intent.recipient || !(await validateAddress(intent.recipient, {}))) return standardOnly();

    const config = await context.config();

    // Activation gate: Tronify is offered only when configured in remote coin-config. Presence of the
    // `energyRent` block is the activation switch — the same source `getEnergyProvider` dispatches on.
    if (!config.energyRent) return standardOnly();

    // Offer Tronify only when the standard path would burn TRX. The standard estimate folds energy,
    // bandwidth and activation into one value; `value === 0n` means the sender covers the transfer
    // for free (enough staked energy/bandwidth), so Tronify would save nothing.
    const standard = await estimateFees(context.logger, config, intent);
    if (standard.value === 0n) return standardOnly();

    return [feeOption(TRONIFY_FEE_OPTION_ID), feeOption(STANDARD_FEE_OPTION_ID)];
  } catch (err) {
    context.logger("tron/listFeeOptions", "failed, falling back to standard-only", { err });
    return standardOnly();
  }
}

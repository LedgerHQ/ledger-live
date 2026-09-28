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
import { getEnergyProvider } from "./energyRent";
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
 *   - a fully-configured Tronify provider resolves from remote coin-config (getEnergyProvider's predicate),
 *   - the sender has a genuine **energy** shortfall (`energyRequired > energyAvailable`) — renting energy
 *     does nothing for a bandwidth-/activation-only cost, and the on-chain delivery gate reads *absolute*
 *     energy, so offering it when energy is already sufficient could release TX-C on an undelivered rental.
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

    // Activation gate: offer Tronify only when a fully-configured provider resolves — the same predicate
    // getEnergyProvider dispatches on (provider name + required url/sourceFlag). A malformed energyRent
    // block (missing url/sourceFlag, unknown provider) throws, degrading to standard-only in the catch
    // instead of advertising an option that only fails later in estimate/craft. Bare call, not `void`:
    // this is synchronous and called only for that throw, and `void` is the floating-Promise idiom that
    // would mislead here (the resolved provider is re-read where it's used).
    getEnergyProvider(config);

    // Offer Tronify only on a genuine ENERGY shortfall (not `value`, which also counts bandwidth/
    // activation): the delivery gate reads absolute energy, so a pre-met threshold could release TX-C on
    // an unpaid rental — gating here keeps that threshold starting unmet. A failed estimate reports a
    // pessimistic shortfall, so it still offers Tronify and surfaces the price error later.
    const standard = await estimateFees(context.logger, config, intent);
    const energyRequired = standard.parameters?.energyRequired;
    const energyAvailable = standard.parameters?.energyAvailable;
    if (
      typeof energyRequired !== "string" ||
      typeof energyAvailable !== "string" ||
      BigInt(energyRequired) <= BigInt(energyAvailable)
    ) {
      return standardOnly();
    }

    return [feeOption(TRONIFY_FEE_OPTION_ID), feeOption(STANDARD_FEE_OPTION_ID)];
  } catch (err) {
    context.logger("tron/listFeeOptions", "failed, falling back to standard-only", { err });
    return standardOnly();
  }
}

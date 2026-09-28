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

/** Fee-payment options (ADR-050 Option 3); never throws — any failure degrades to standard-only.
 * Tronify is offered only on a genuine energy shortfall, since the on-chain delivery gate reads
 * absolute energy and would otherwise risk releasing TX-C on an undelivered rental. */
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

    // Not enabled is the normal state, not a failure — return before the gate so it isn't logged below.
    if (!config.energyRent) return standardOnly();

    // A malformed energyRent block (missing url/sourceFlag, unknown provider) throws here, degrading
    // to standard-only in the catch instead of advertising an option that only fails later.
    getEnergyProvider(config);

    const standard = await estimateFees(context.logger, config, intent);
    const energyRequired = standard.parameters?.energyRequired;
    const energyAvailable = standard.parameters?.energyAvailable;
    if (
      standard.parameters?.energyEstimated !== true ||
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

import type { FeeEstimation, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { craftTransaction } from "../craftTransaction";

/**
 * Estimate the mass-based fee for a Kaspa transaction intent. Kaspa's fee is a deterministic
 * function of the crafted transaction's compute/storage mass (see `logic/massCalcluation.ts`,
 * used internally by `logic/utxos/selection`), so — like coin-cardano — the estimate is obtained
 * by crafting the unsigned transaction and reading back the fee it settled on. There is no
 * fee-market parameter to accept, so `customFeesParameters` is ignored for Kaspa.
 */
export async function estimateFees(
  intent: TransactionIntent,
  _customFeesParameters?: FeeEstimation["parameters"],
): Promise<FeeEstimation> {
  const { details } = await craftTransaction(intent);
  const fee = typeof details?.fee === "string" ? details.fee : "0";
  return { value: BigInt(fee) };
}

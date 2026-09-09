import type { CraftedTransaction } from "@ledgerhq/coin-module-framework/api/index";

/**
 * Return an already-built raw payment transaction for the device to sign, unchanged.
 *
 * TRON normally builds its own transactions from a `TransactionIntent` (see {@link craftTransaction}),
 * so for the ordinary send path "the chain takes no externally-built transaction". The one exception
 * is the Tronify gas-sponsorship flow (LIVE-32780): TX-A is an energy-rental payment transaction
 * built by Tronify's backend that the device must sign exactly as delivered. This pass-through lets
 * that pre-built `raw_data_hex` ride the generic raw-sign path (`genericSignRawOperation` → signer →
 * {@link combine}) without coin-tron re-crafting it from an intent.
 *
 * The input is the Tronify order's `raw_data_hex` — the same string coin-tron signs and `combine`s
 * everywhere else (see `toCrafted` in craftTransaction.ts). It is returned verbatim after a shape
 * check, so the device signs the exact bytes Tronify will broadcast.
 */
export function craftRawTransaction(rawDataHex: string): CraftedTransaction {
  // Require whole bytes: `raw_data_hex` is raw bytes, so an odd-length hex string (e.g. "abc") is
  // ambiguous — reject it rather than let the device sign different bytes than Tronify intended.
  if (typeof rawDataHex !== "string" || !/^([0-9a-fA-F]{2})+$/.test(rawDataHex)) {
    throw new Error(
      "Tron craftRawTransaction expects a non-empty even-length hex raw_data_hex string",
    );
  }
  return { transaction: rawDataHex };
}

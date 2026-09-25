import type { CraftedTransaction } from "@ledgerhq/coin-module-framework/api/index";

/** Pass-through for the Tronify sponsored flow's pre-built TX-A (LIVE-32780): returned verbatim so the
 * device signs exactly the bytes Tronify broadcasts. */
export function craftRawTransaction(rawDataHex: string): CraftedTransaction {
  // Require whole bytes: `raw_data_hex` is raw bytes, so an odd-length hex string is ambiguous —
  // reject it rather than let the device sign different bytes than Tronify intended.
  if (typeof rawDataHex !== "string" || !/^([0-9a-fA-F]{2})+$/.test(rawDataHex)) {
    throw new Error(
      "Tron craftRawTransaction expects a non-empty even-length hex raw_data_hex string",
    );
  }
  return { transaction: rawDataHex };
}

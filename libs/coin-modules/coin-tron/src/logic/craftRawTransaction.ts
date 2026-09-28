import type { CraftedTransaction } from "@ledgerhq/coin-module-framework/api/index";
import { InvalidRawDataHex } from "../types/errors";

/** Pass-through for the Tronify sponsored flow's pre-built TX-A (LIVE-32780): returned verbatim so the
 * device signs exactly the bytes Tronify broadcasts. */
export function craftRawTransaction(rawDataHex: string): CraftedTransaction {
  // Odd-length hex is ambiguous — reject rather than let the device sign different bytes than intended.
  if (typeof rawDataHex !== "string" || !/^([0-9a-fA-F]{2})+$/.test(rawDataHex)) {
    throw new InvalidRawDataHex(
      "Tron craftRawTransaction expects a non-empty even-length hex raw_data_hex string",
    );
  }
  return { transaction: rawDataHex };
}

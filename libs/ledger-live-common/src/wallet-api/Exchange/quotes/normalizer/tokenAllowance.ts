import type { QuoteTokenAllowance } from "../types";
import type { RawQuote } from "../service/types";

/**
 * Map the raw `tokenAllowanceData` into the wallet `tokenAllowance` schema.
 *
 * The shape is already aligned (including the nested EVM `approvalTransaction`
 * blob): only the field name changes (`tokenAllowanceData` → `tokenAllowance`).
 * Optional inner fields are omitted when absent so the output mirrors the raw
 * presence/absence exactly — consumers distinguish "approved" (`isApproved:
 * true`, no transaction needed) from "needs approval" (carries
 * `approvalTransaction` so the swap SDK can broadcast it).
 */
export function buildTokenAllowance(quote: RawQuote): QuoteTokenAllowance | undefined {
  const raw = quote.tokenAllowanceData;
  if (raw === undefined) {
    return undefined;
  }

  const result: QuoteTokenAllowance = { isApproved: raw.isApproved };
  if (raw.approvedAmount !== undefined) {
    result.approvedAmount = raw.approvedAmount;
  }
  if (raw.approvalTransaction !== undefined) {
    result.approvalTransaction = raw.approvalTransaction;
  }
  return result;
}

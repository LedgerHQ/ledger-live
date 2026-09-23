import type { RatesResponse, RawRatesResponse } from "../schema";

/**
 * Keeps the numeric entries of a rates payload and drops the rest.
 *
 * A dropped key reads back as a missing rate, which every caller already handles: a historical gap
 * is filled by the cache, and a missing spot value becomes 0. Rejecting the whole payload instead
 * would lose the rates that were fine.
 */
export function pickNumericRates(raw: RawRatesResponse): RatesResponse {
  return Object.fromEntries(
    Object.entries(raw).filter((entry): entry is [string, number] => typeof entry[1] === "number"),
  );
}

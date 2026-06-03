import type { QuoteNetworkFees, QuotePayoutNetworkFees } from "../types";
import type { RawQuote } from "../service/types";

/**
 * Build the send-side `networkFees` descriptor from the raw quote.
 *
 * Only the `currencyId` is required on the wire. `gasLimit` is carried over
 * when the provider returns a non-empty value; empty strings are treated as
 * "not provided" so consumers do not render a meaningless gas value.
 */
export function buildNetworkFees(quote: RawQuote): QuoteNetworkFees {
  const raw = quote.networkFees;
  const networkFees: QuoteNetworkFees = {
    currencyId: raw.currency,
  };
  if (raw.value !== undefined) {
    networkFees.value = raw.value;
  }
  if (raw.gasLimit !== undefined && raw.gasLimit !== "") {
    networkFees.gasLimit = raw.gasLimit;
  }
  return networkFees;
}

/**
 * Map a raw payout-network-fees row to the wallet schema. Returns `undefined`
 * when the provider did not advertise any payout-side fee (most DEX rows),
 * and preserves legitimate `value: 0` rows so consumers can distinguish
 * "fee not applicable" (undefined) from "fee is zero" (present).
 *
 * The only shape change is `currency` → `currencyId` so the field lines up
 * with the rest of the wallet `QuoteDetails` currency references.
 */
export function buildPayoutNetworkFees(quote: RawQuote): QuotePayoutNetworkFees | undefined {
  const raw = quote.payoutNetworkFees;
  if (raw === undefined) {
    return undefined;
  }
  return { value: raw.value, currencyId: raw.currency };
}

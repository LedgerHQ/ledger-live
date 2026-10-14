import type { Currency } from "@domain/entity-currency";

export type RateQuery = {
  value: number;
  from: Currency;
  to: Currency;
  date?: Date | null;
  reverse?: boolean;
  disableRounding?: boolean;
};

/** Countervalues operations this package needs. The host app supplies the implementation. */
export interface RateLookup {
  /**
   * @param snapshot Countervalues state. Opaque to this package: callers supply it and it is
   * forwarded unread, so its concrete shape stays a concern of whoever produces it.
   */
  calculate(snapshot: unknown, query: RateQuery): number | null | undefined;
  /**
   * Fingerprint of the rate history relevant to this pair up to `lastOpDate`. Two snapshots
   * sharing it convert identically over that span, so it is safe to memoise against.
   */
  historyKey(snapshot: unknown, from: Currency, to: Currency, lastOpDate: Date | null): string;
  /** The id a currency is known by on the countervalues API. */
  currencyApiId(currency: Currency): string;
}

let lookup: RateLookup | undefined;

/**
 * Register the countervalues lookup. Should be called once during application
 * initialization, before any profit and loss is computed.
 */
export function setRateLookup(impl: RateLookup): void {
  lookup = impl;
}

/** Clear the registered lookup. For tests. */
export function resetRateLookup(): void {
  lookup = undefined;
}

/**
 * Get the registered lookup.
 * @throws {Error} If {@link setRateLookup} has not been called yet.
 */
export function getRateLookup(): RateLookup {
  if (!lookup) {
    throw new Error("Rate lookup is not set. Please call setRateLookup during app initialization.");
  }
  return lookup;
}

// Countervalues access, injected by the host app at startup. Declaring the
// interface here is what lets this package carry no countervalues dependency.

import type { Currency } from "@domain/entity-currency";

/**
 * Countervalues state, opaque to this package. Callers supply it and it is
 * forwarded unread to {@link RateLookup.calculate}, so its concrete shape stays
 * a concern of whoever produces it.
 */
export type RateSnapshot = unknown;

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
  calculate(snapshot: RateSnapshot, query: RateQuery): number | null | undefined;
}

let lookup: RateLookup | undefined;

/**
 * Register the countervalues lookup. Should be called once during application
 * initialization, before any analytics value change is computed.
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

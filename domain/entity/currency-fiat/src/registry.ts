import * as currencies from "./currencies";
import type { FiatCurrency } from "./schema";

/**
 * Pre-built registry of all known fiat currencies, keyed by currency id.
 */
export const FIAT_CURRENCIES_REGISTRY: Record<string, FiatCurrency> = Object.fromEntries(
  Object.values(currencies)
    .filter((c): c is FiatCurrency => Boolean(c))
    .map(c => [c.id, c]),
);

/** All known fiat currency ids as a constant array. */
export const FIAT_CURRENCIES_IDS = Object.values(FIAT_CURRENCIES_REGISTRY).map(c => c.id);

import { CurrencyIdSchema } from "@shared/schema-primitives";
import type { FiatCurrency } from "./schema";

/**
 * Returns a valid {@link FiatCurrency} fixture (US Dollar).
 * Pass `overrides` to customise individual fields for a specific test.
 */
export function mockFiatCurrency(overrides?: Partial<FiatCurrency>): FiatCurrency {
  return {
    type: "FiatCurrency",
    id: CurrencyIdSchema.parse("usd"),
    name: "US Dollar",
    ticker: "USD",
    symbol: "$",
    units: [{ name: "US Dollar", code: "USD", magnitude: 2 }],
    ...overrides,
  };
}

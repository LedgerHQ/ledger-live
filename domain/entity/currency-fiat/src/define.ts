import { z } from "zod";
import { FiatCurrencySchema, type FiatCurrency } from "./schema";

/**
 * Defines a fiat currency entity, validating the input against
 * {@link FiatCurrencySchema} and returning a fully-typed domain object.
 *
 * @example
 * ```ts
 * export const usd = fiat({
 *   type: "FiatCurrency",
 *   id: "usd",
 *   name: "US Dollar",
 *   ticker: "USD",
 *   symbol: "$",
 *   units: [{ name: "US Dollar", code: "USD", magnitude: 2 }],
 * });
 * ```
 */
export function fiat(data: z.input<typeof FiatCurrencySchema>): FiatCurrency {
  return FiatCurrencySchema.parse(data);
}

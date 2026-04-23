import { z } from "zod";
import { CryptoCurrencySchema } from "./schema";
import type { CryptoCurrency } from "./schema";

/**
 * Defines a crypto currency entity, validating the input against
 * {@link CryptoCurrencySchema} and returning a fully-typed domain object.
 *
 * Used by each file in `src/currencies/` to declare a single currency.
 * Calling `CryptoCurrencySchema.parse()` constructs branded value objects
 * (e.g. `CurrencyId`) without explicit casts.
 *
 * @example
 * ```ts
 * export const bitcoin = currency({
 *   type: "CryptoCurrency",
 *   id: "bitcoin",
 *   name: "Bitcoin",
 *   // ...
 * });
 * ```
 */
export function currency(data: z.input<typeof CryptoCurrencySchema>): CryptoCurrency {
  return CryptoCurrencySchema.parse(data);
}

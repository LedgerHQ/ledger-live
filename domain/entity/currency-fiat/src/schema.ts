import { z } from "zod";
import { UnitSchema } from "@domain/entity-currency-unit";

/** ISO 4217 ticker of a fiat currency (e.g. `"USD"`, `"EUR"`): three uppercase letters. */
export const FiatCurrencyTickerSchema = z
  .string()
  .regex(/^[A-Z]{3}$/)
  .brand<"FiatCurrencyTicker">();

/**
 * Canonical Zod-first schema for a fiat currency entity.
 *
 * Written from scratch — does **not** derive from the legacy currency types.
 * TS types are derived via `z.infer<>`.
 *
 * @see {@link FiatCurrency} for the inferred TypeScript type.
 */
export const FiatCurrencySchema = z.object({
  /** Discriminant for the currency union — always `"FiatCurrency"`. */
  type: z.literal("FiatCurrency"),
  /** Human-readable display name (e.g. `"US Dollar"`). */
  name: z.string(),
  /** ISO 4217 ticker (e.g. `"USD"`, `"EUR"`). */
  ticker: FiatCurrencyTickerSchema,
  /**
   * Ordered list of display units. By convention `units[0]` is the default
   * (highest magnitude) unit. Must contain at least one entry.
   */
  units: z.array(UnitSchema).min(1),
  /** Currency symbol (e.g. `"$"`, `"€"`, `"£"`). */
  symbol: z.string().optional(),
  /** When `true`, countervalue display is disabled. */
  disableCountervalue: z.boolean().optional(),
  /** Search keywords (e.g. `["dollar", "usd"]`). */
  keywords: z.array(z.string()).optional(),
});

/** A fiat currency ISO 4217 ticker, inferred from {@link FiatCurrencyTickerSchema}. */
export type FiatCurrencyTicker = z.infer<typeof FiatCurrencyTickerSchema>;
/** A fiat currency entity, inferred from {@link FiatCurrencySchema}. */
export type FiatCurrency = z.infer<typeof FiatCurrencySchema>;

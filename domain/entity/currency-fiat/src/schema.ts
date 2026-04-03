import { z } from "zod";
import { CurrencyIdSchema } from "@shared/schema-primitives";
import { UnitSchema } from "@domain/entity-unit";

/**
 * Canonical Zod-first schema for a fiat currency entity.
 *
 * Written from scratch — does **not** import from `@ledgerhq/types-cryptoassets`.
 * TS types are derived via `z.infer<>`.
 *
 * @see {@link FiatCurrency} for the inferred TypeScript type.
 */
export const FiatCurrencySchema = z.object({
  /** Discriminant for the currency union — always `"FiatCurrency"`. */
  type: z.literal("FiatCurrency"),
  /** Unique opaque id (e.g. `"usd"`, `"eur"`). */
  id: CurrencyIdSchema,
  /** Human-readable display name (e.g. `"US Dollar"`). */
  name: z.string(),
  /** ISO 4217 ticker (e.g. `"USD"`, `"EUR"`). */
  ticker: z.string(),
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

/** A fiat currency entity, inferred from {@link FiatCurrencySchema}. */
export type FiatCurrency = z.infer<typeof FiatCurrencySchema>;

import { z } from "zod";

/**
 * Zod schema for a currency unit (e.g. BTC, mBTC, satoshi).
 *
 * A `Unit` is a value object embedded inside currency entities — it is never
 * stored independently and has no Redux slice.
 */
export const UnitSchema = z.object({
  /** Human-readable name of the unit (e.g. "Bitcoin", "Satoshi"). */
  name: z.string(),
  /** Ticker / symbol used to display amounts (e.g. "BTC", "sat"). */
  code: z.string(),
  /**
   * Number of decimal places relative to the base unit.
   * Must be a non-negative integer (e.g. 8 for BTC, 0 for satoshi).
   */
  magnitude: z.number().int().min(0),
  /** When `true`, trailing zeros are always shown up to `magnitude` digits. */
  showAllDigits: z.boolean().optional(),
  /** When `true`, the `code` is rendered before the amount rather than after. */
  prefixCode: z.boolean().optional(),
});

/** A currency unit value object, inferred from {@link UnitSchema}. */
export type Unit = z.infer<typeof UnitSchema>;

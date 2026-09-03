import { z } from "zod";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { DateTimeIsoSchema } from "@shared/schema-primitives";

/**
 * The rate kinds the apps understand.
 *
 * DADA sends values outside this set, so {@link InterestRateSchema} keeps `type` as a plain string
 * and consumers narrow to this union, dropping anything unrecognised.
 */
export const ApyTypeSchema = z.enum(["NRR", "APY", "APR"]);

/** A rate as the apps display it, once an unrecognised {@link InterestRateSchema} type is dropped. */
export const ApySchema = z.object({
  /** Ratio, not a percentage: 0.0425 renders as 4.25%. */
  value: z.number(),
  type: ApyTypeSchema,
});

/** An interest rate attached to one currency. */
export const InterestRateSchema = z.object({
  /** Crypto or token id: DADA keys rates by both, so the crypto form alone would reject tokens. */
  currencyId: CryptoOrTokenCurrencyIdSchema,
  /** Interest rate value */
  rate: z.number(),
  /** Type of rate (NRR, APR, APY, etc.) — intentionally wider than ApyType, see above */
  type: z.string(),
  /**
   * When the rate was read, as an ISO datetime with offset.
   *
   * Optional because nothing reads it: DADA omitting it, or sending a date without a time, must
   * not cost an otherwise usable rate.
   */
  fetchAt: DateTimeIsoSchema.optional(),
});

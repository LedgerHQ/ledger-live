import { z } from "zod";

/**
 * The rate kinds the apps understand.
 *
 * DADA sends values outside this set, so {@link InterestRateSchema} keeps `type` as a plain string
 * and consumers narrow to this union, dropping anything unrecognised.
 */
export const ApyTypeSchema = z.enum(["NRR", "APY", "APR"]);

/** An interest rate attached to one currency. */
export const InterestRateSchema = z.object({
  /** Currency identifier */
  currencyId: z.string(),
  /** Interest rate value */
  rate: z.number(),
  /** Type of rate (NRR, APR, APY, etc.) — intentionally wider than ApyType, see above */
  type: z.string(),
  /** Timestamp when the rate was fetched */
  fetchAt: z.string(),
});

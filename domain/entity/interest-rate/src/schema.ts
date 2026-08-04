import { z } from "zod";
import {
  CryptoCurrencyIdSchema,
  DateTimeIsoSchema,
  TokenCurrencyIdSchema,
} from "@shared/schema-primitives";

/**
 * The rate kinds the apps understand.
 *
 * DADA sends values outside this set, so {@link InterestRateSchema} keeps `type` as a plain string
 * and consumers narrow to this union, dropping anything unrecognised.
 */
export const ApyTypeSchema = z.enum(["NRR", "APY", "APR"]);

/**
 * The currency an interest rate is attached to.
 *
 * DADA keys `interestRates` by both crypto ids (`ethereum`) and token ids
 * (`ethereum/erc20/usd_tether`), so this is a union rather than either brand alone.
 */
export const InterestRateCurrencyIdSchema = z.union([
  CryptoCurrencyIdSchema,
  TokenCurrencyIdSchema,
]);

/** An interest rate attached to one currency. */
export const InterestRateSchema = z.object({
  /** Currency identifier */
  currencyId: InterestRateCurrencyIdSchema,
  /** Interest rate value */
  rate: z.number(),
  /** Type of rate (NRR, APR, APY, etc.) — intentionally wider than ApyType, see above */
  type: z.string(),
  /** Timestamp when the rate was fetched */
  fetchAt: DateTimeIsoSchema,
});

import { z } from "zod";
import { ApyTypeSchema, InterestRateCurrencyIdSchema, InterestRateSchema } from "./schema";

/** Canonical interest rate inferred from {@link InterestRateSchema}. */
export type InterestRate = z.infer<typeof InterestRateSchema>;

/** The rate kinds the apps understand, inferred from {@link ApyTypeSchema}. */
export type ApyType = z.infer<typeof ApyTypeSchema>;

/** A crypto or token id, as DADA keys interest rates by either. */
export type InterestRateCurrencyId = z.infer<typeof InterestRateCurrencyIdSchema>;

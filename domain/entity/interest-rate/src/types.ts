import { z } from "zod";
import { ApySchema, ApyTypeSchema, InterestRateSchema } from "./schema";

/** Canonical interest rate inferred from {@link InterestRateSchema}. */
export type InterestRate = z.infer<typeof InterestRateSchema>;

/** The rate kinds the apps understand, inferred from {@link ApyTypeSchema}. */
export type ApyType = z.infer<typeof ApyTypeSchema>;

/** The app-facing rate shape inferred from {@link ApySchema}. */
export type Apy = z.infer<typeof ApySchema>;

import { z } from "zod";
import { ApyTypeSchema, InterestRateSchema } from "./schema";

/** Canonical interest rate inferred from {@link InterestRateSchema}. */
export type InterestRate = z.infer<typeof InterestRateSchema>;

/** The rate kinds the apps understand, inferred from {@link ApyTypeSchema}. */
export type ApyType = z.infer<typeof ApyTypeSchema>;

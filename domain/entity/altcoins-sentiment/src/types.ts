import { z } from "zod";
import { AltcoinSeasonIndexSchema } from "./schema";

/** Canonical altcoins-sentiment value inferred from {@link AltcoinSeasonIndexSchema}. */
export type AltcoinSeasonIndex = z.infer<typeof AltcoinSeasonIndexSchema>;

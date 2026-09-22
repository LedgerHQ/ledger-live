import { z } from "zod";
import { AltcoinSeasonIndexSchema } from "./schema";

/** Canonical Altcoin Season Index value inferred from {@link AltcoinSeasonIndexSchema}. */
export type AltcoinSeasonIndex = z.infer<typeof AltcoinSeasonIndexSchema>;

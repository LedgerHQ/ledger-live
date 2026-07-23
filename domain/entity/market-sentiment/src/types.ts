import { z } from "zod";
import { FearAndGreedIndexSchema } from "./schema";

/** Canonical market-sentiment value inferred from {@link FearAndGreedIndexSchema}. */
export type FearAndGreedIndex = z.infer<typeof FearAndGreedIndexSchema>;

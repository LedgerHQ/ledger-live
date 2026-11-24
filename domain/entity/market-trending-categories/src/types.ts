import { z } from "zod";
import { TrendingCategorySchema } from "./schema";

/** A trending market category inferred from {@link TrendingCategorySchema}. */
export type TrendingCategory = z.infer<typeof TrendingCategorySchema>;

import { z } from "zod";

/** A trending market category the Market list can be filtered by (e.g. `infrastructure`). */
export const TrendingCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
});

/** The trending categories list, in the order the backend returns it. */
export const TrendingCategoriesSchema = z.array(TrendingCategorySchema);

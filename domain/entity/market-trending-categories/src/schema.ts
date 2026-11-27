import { z } from "zod";

export const MarketTrendingCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const MarketTrendingCategoriesSchema = z.array(MarketTrendingCategorySchema);

import type { z } from "zod";
import type { MarketTrendingCategorySchema } from "./schema";

export type MarketTrendingCategory = z.infer<typeof MarketTrendingCategorySchema>;

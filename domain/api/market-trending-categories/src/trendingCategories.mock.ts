import type { TrendingCategory } from "@domain/entity-market-trending-categories";

/** A schema-validated `/v3/categories/trending` response, with more than the kept maximum. */
export const mockTrendingCategoriesResponse: TrendingCategory[] = [
  { id: "infrastructure", name: "Infrastructure" },
  { id: "defi", name: "DeFi" },
  { id: "layer-2", name: "Layer 2" },
  { id: "memes", name: "Memes" },
  { id: "ai", name: "AI" },
  { id: "gaming", name: "Gaming" },
];

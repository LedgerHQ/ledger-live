import { ZodError } from "zod";
import { MAX_TRENDING_CATEGORIES, transformTrendingCategoriesResponse } from "./transforms";
import { mockTrendingCategoriesResponse } from "./trendingCategories.mock";

describe("transformTrendingCategoriesResponse", () => {
  it("keeps the first categories, in the backend order, up to the maximum", () => {
    const result = transformTrendingCategoriesResponse(mockTrendingCategoriesResponse);

    expect(result).toHaveLength(MAX_TRENDING_CATEGORIES);
    expect(result.map(category => category.id)).toEqual([
      "infrastructure",
      "defi",
      "layer-2",
      "memes",
      "ai",
    ]);
  });

  it("keeps a shorter list as it is", () => {
    const result = transformTrendingCategoriesResponse([{ id: "defi", name: "DeFi" }]);

    expect(result).toEqual([{ id: "defi", name: "DeFi" }]);
  });

  it("throws on an invalid payload", () => {
    expect(() => transformTrendingCategoriesResponse({ id: "defi", name: "DeFi" })).toThrow(
      ZodError,
    );
    expect(() => transformTrendingCategoriesResponse([{ id: "defi" }])).toThrow(ZodError);
  });
});

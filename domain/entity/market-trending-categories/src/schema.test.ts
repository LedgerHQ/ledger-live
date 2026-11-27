import { MarketTrendingCategoriesSchema, MarketTrendingCategorySchema } from "./schema";

describe("MarketTrendingCategorySchema", () => {
  it("accepts a category with an id and a name", () => {
    const category = { id: "layer-1", name: "Layer 1" };

    expect(MarketTrendingCategorySchema.parse(category)).toEqual(category);
  });

  it("rejects a category without a name", () => {
    expect(MarketTrendingCategorySchema.safeParse({ id: "layer-1" }).success).toBe(false);
  });

  it("rejects a category whose id is not a string", () => {
    expect(MarketTrendingCategorySchema.safeParse({ id: 1, name: "Layer 1" }).success).toBe(false);
  });
});

describe("MarketTrendingCategoriesSchema", () => {
  it("accepts an empty list", () => {
    expect(MarketTrendingCategoriesSchema.parse([])).toEqual([]);
  });

  it("rejects a list holding an invalid category", () => {
    expect(MarketTrendingCategoriesSchema.safeParse([{ id: "x" }]).success).toBe(false);
  });
});

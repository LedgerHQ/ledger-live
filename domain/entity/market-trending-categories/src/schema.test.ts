import { TrendingCategoriesSchema, TrendingCategorySchema } from "./schema";

describe("TrendingCategorySchema", () => {
  it("validates a well-formed category", () => {
    expect(TrendingCategorySchema.parse({ id: "infrastructure", name: "Infrastructure" })).toEqual({
      id: "infrastructure",
      name: "Infrastructure",
    });
  });

  it("rejects a category without a name", () => {
    expect(TrendingCategorySchema.safeParse({ id: "infrastructure" }).success).toBe(false);
  });
});

describe("TrendingCategoriesSchema", () => {
  it("validates a list and keeps its order", () => {
    const parsed = TrendingCategoriesSchema.parse([
      { id: "b", name: "B" },
      { id: "a", name: "A" },
    ]);

    expect(parsed.map(category => category.id)).toEqual(["b", "a"]);
  });

  it("rejects a payload that is not a list", () => {
    expect(TrendingCategoriesSchema.safeParse({ id: "a", name: "A" }).success).toBe(false);
  });
});

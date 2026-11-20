import { toMaxSpendableFilters } from "./maxSpendableFilters";

describe("toMaxSpendableFilters", () => {
  it("is undefined when the caller gave no filter", () => {
    expect(toMaxSpendableFilters({})).toBeUndefined();
  });

  it("keeps only the filters that were given", () => {
    expect(toMaxSpendableFilters({ pools: ["transparent"] })).toEqual({ pools: ["transparent"] });
    expect(toMaxSpendableFilters({ private: false })).toEqual({ private: false });
    expect(toMaxSpendableFilters({ pools: ["ironwood"], private: true })).toEqual({
      pools: ["ironwood"],
      private: true,
    });
  });
});

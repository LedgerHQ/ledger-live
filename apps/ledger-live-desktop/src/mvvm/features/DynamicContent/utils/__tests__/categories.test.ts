import type { Card as BrazeCard } from "@braze/web-sdk";
import {
  CategoryContentCard,
  ContentCardsLayout,
  ContentCardsType,
  LocationContentCard,
} from "~/types/dynamicContent";
import {
  dedupeCategoriesByCategoryId,
  filterCategoriesByLocation,
  formatCategories,
} from "../categories";

const aCategory = (overrides: Partial<CategoryContentCard> = {}): CategoryContentCard => ({
  id: "category-1",
  categoryId: "alwayson",
  title: "Category",
  description: "Description",
  location: LocationContentCard.Portfolio,
  cardsLayout: ContentCardsLayout.carousel,
  cardsType: ContentCardsType.smallSquare,
  type: ContentCardsType.category,
  created: new Date("2026-01-01"),
  ...overrides,
});

const aChildCard = (categoryId: string | undefined, id = "child-1"): BrazeCard =>
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  ({ id, extras: categoryId ? { categoryId } : {} }) as unknown as BrazeCard;

describe("filterCategoriesByLocation", () => {
  it("should keep only the categories matching the requested location", () => {
    const topPortfolio = aCategory({
      id: "a",
      location: LocationContentCard.Portfolio,
    });
    const bottomPortfolio = aCategory({
      id: "b",
      location: LocationContentCard.BottomPortfolio,
    });

    const result = filterCategoriesByLocation(
      [topPortfolio, bottomPortfolio],
      LocationContentCard.Portfolio,
    );

    expect(result).toEqual([topPortfolio]);
  });

  it("should return an empty list when no category matches", () => {
    const bottomPortfolio = aCategory({ location: LocationContentCard.BottomPortfolio });

    expect(filterCategoriesByLocation([bottomPortfolio], LocationContentCard.Portfolio)).toEqual(
      [],
    );
  });
});

describe("dedupeCategoriesByCategoryId", () => {
  it("should keep the first category of each categoryId", () => {
    const first = aCategory({ id: "a", categoryId: "alwayson" });
    const duplicate = aCategory({ id: "b", categoryId: "alwayson" });
    const other = aCategory({ id: "c", categoryId: "promo" });

    expect(dedupeCategoriesByCategoryId([first, duplicate, other])).toEqual([first, other]);
  });

  it("should drop categories that have no categoryId, as no child can ever match them", () => {
    const withoutId = aCategory({ id: "a", categoryId: undefined });
    const withId = aCategory({ id: "b", categoryId: "promo" });

    expect(dedupeCategoriesByCategoryId([withoutId, withId])).toEqual([withId]);
  });
});

describe("formatCategories", () => {
  it("should attach the child cards declaring the category id", () => {
    const category = aCategory({ categoryId: "alwayson" });
    const child = aChildCard("alwayson");
    const unrelated = aChildCard("promo", "child-2");

    expect(formatCategories([category], [child, unrelated])).toEqual([
      { category, cards: [child] },
    ]);
  });

  it("should not let a category without an id swallow the cards that have no category", () => {
    const misconfigured = aCategory({ id: "a", categoryId: undefined });
    const standaloneCard = aChildCard(undefined, "portfolio-card");

    expect(formatCategories([misconfigured], [standaloneCard])).toEqual([]);
  });

  it("should drop categories that have no child card", () => {
    const withChild = aCategory({ id: "a", categoryId: "alwayson" });
    const withoutChild = aCategory({ id: "b", categoryId: "empty" });

    const result = formatCategories([withChild, withoutChild], [aChildCard("alwayson")]);

    expect(result).toHaveLength(1);
    expect(result[0].category).toBe(withChild);
  });

  it("should order categories by their order extra", () => {
    const second = aCategory({ id: "a", categoryId: "second", order: 2 });
    const first = aCategory({ id: "b", categoryId: "first", order: 1 });

    const result = formatCategories(
      [second, first],
      [aChildCard("second", "child-a"), aChildCard("first", "child-b")],
    );

    expect(result.map(({ category }) => category.categoryId)).toEqual(["first", "second"]);
  });

  it("should not mutate the categories it receives", () => {
    const second = aCategory({ id: "a", categoryId: "second", order: 2 });
    const first = aCategory({ id: "b", categoryId: "first", order: 1 });
    const categories = [second, first];

    formatCategories(categories, [aChildCard("second"), aChildCard("first", "child-b")]);

    expect(categories).toEqual([second, first]);
  });
});

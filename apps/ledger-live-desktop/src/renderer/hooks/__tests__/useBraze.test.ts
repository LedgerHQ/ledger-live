import type { ClassicCard } from "@braze/web-sdk";
import { ContentCardsLayout, ContentCardsType, LocationContentCard } from "~/types/dynamicContent";

jest.mock("@braze/web-sdk", () => require("tests/mocks/brazeWebSdk").getBrazeWebSdkJestMock());

import { filterByType, mapAsCategoryContentCard } from "../useBraze";

const aBrazeCard = (extras: Record<string, string>, id = "card-1") =>
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  ({
    id,
    updated: new Date("2026-01-01"),
    viewed: false,
    extras,
  }) as unknown as ClassicCard;

describe("filterByType", () => {
  it("should keep only the cards declaring the requested type", () => {
    const category = aBrazeCard({ type: "category" }, "category-1");
    const child = aBrazeCard({ type: "small_square" }, "child-1");

    expect(filterByType([category, child], ContentCardsType.category)).toEqual([category]);
  });

  it("should ignore cards without a type", () => {
    const placement = aBrazeCard({ location: "portfolio" });

    expect(filterByType([placement], ContentCardsType.category)).toEqual([]);
  });
});

describe("mapAsCategoryContentCard", () => {
  it("should place the alwayson category on the portfolio carousel", () => {
    const card = aBrazeCard({
      type: "category",
      id: "alwayson",
      cardsLayout: "carousel",
      cardsType: "small_square",
    });

    expect(mapAsCategoryContentCard(card).location).toBe(LocationContentCard.Portfolio);
  });

  it("should keep the declared location for any other category", () => {
    const card = aBrazeCard({
      type: "category",
      id: "promo",
      location: "portfolio",
      cardsLayout: "grid",
      cardsType: "hero",
    });

    expect(mapAsCategoryContentCard(card).location).toBe(LocationContentCard.Portfolio);
  });

  it("should expose the braze extras as typed category fields", () => {
    const card = aBrazeCard({
      type: "category",
      id: "alwayson",
      title: "Get a Ledger",
      description: "Secure your assets",
      cta: "Discover",
      order: "2",
      cardsLayout: "carousel",
      cardsType: "small_square",
    });

    expect(mapAsCategoryContentCard(card)).toMatchObject({
      id: "card-1",
      categoryId: "alwayson",
      title: "Get a Ledger",
      description: "Secure your assets",
      cta: "Discover",
      order: 2,
      cardsLayout: ContentCardsLayout.carousel,
      cardsType: ContentCardsType.smallSquare,
      type: ContentCardsType.category,
    });
  });

  it("should read the boolean extras braze sends as strings", () => {
    const card = aBrazeCard({
      type: "category",
      id: "alwayson",
      isDismissable: "true",
      hasPagination: "true",
      centeredText: "false",
    });

    expect(mapAsCategoryContentCard(card)).toMatchObject({
      isDismissable: true,
      hasPagination: true,
      centeredText: false,
    });
  });

  it("should append the resolved location to the deeplink", () => {
    const card = aBrazeCard({
      type: "category",
      id: "alwayson",
      link: "ledgerlive://discover",
    });

    expect(mapAsCategoryContentCard(card).link).toContain("portfolio");
  });
});

import {
  CategoryContentCard,
  ContentCardsLayout,
  ContentCardsType,
  LocationContentCard,
} from "~/types/dynamicContent";
import { shouldShowHardwareCarouselCloseAll } from "./shouldShowHardwareCarouselCloseAll";

const baseCategory = {
  id: "alwayson-category",
  categoryId: "alwayson",
  title: "Discover our devices",
  description: "",
  created: new Date("2026-01-01"),
  type: ContentCardsType.category,
} as CategoryContentCard;

describe("shouldShowHardwareCarouselCloseAll", () => {
  it("returns true for dismissable portfolio carousel categories", () => {
    expect(
      shouldShowHardwareCarouselCloseAll({
        ...baseCategory,
        location: LocationContentCard.Portfolio,
        cardsLayout: ContentCardsLayout.carousel,
        cardsType: ContentCardsType.smallSquare,
        isDismissable: true,
      }),
    ).toBe(true);
  });

  it("returns false for non-small_square carousel types such as action cards", () => {
    expect(
      shouldShowHardwareCarouselCloseAll({
        ...baseCategory,
        location: LocationContentCard.Portfolio,
        cardsLayout: ContentCardsLayout.carousel,
        cardsType: ContentCardsType.action,
        isDismissable: true,
      }),
    ).toBe(false);
  });

  it("returns false for unique layout or non-portfolio placements", () => {
    expect(
      shouldShowHardwareCarouselCloseAll({
        ...baseCategory,
        location: LocationContentCard.Portfolio,
        cardsLayout: ContentCardsLayout.unique,
        cardsType: ContentCardsType.hero,
        isDismissable: true,
      }),
    ).toBe(false);

    expect(
      shouldShowHardwareCarouselCloseAll({
        ...baseCategory,
        location: LocationContentCard.Action,
        cardsLayout: ContentCardsLayout.carousel,
        cardsType: ContentCardsType.smallSquare,
        isDismissable: true,
      }),
    ).toBe(false);
  });
});

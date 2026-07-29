import {
  CategoryContentCard,
  ContentCardLocation,
  ContentCardsLayout,
  ContentCardsType,
} from "~/dynamicContent/types";
import { shouldShowHardwareCarouselCloseAll } from "./shouldShowHardwareCarouselCloseAll";

const baseCategory = {
  id: "alwayson-category",
  categoryId: "alwayson",
  createdAt: 1000,
  viewed: false,
  order: 0,
  type: ContentCardsType.category,
} as CategoryContentCard;

describe("shouldShowHardwareCarouselCloseAll", () => {
  it("returns true for dismissable top_wallet carousel categories", () => {
    expect(
      shouldShowHardwareCarouselCloseAll({
        ...baseCategory,
        location: ContentCardLocation.TopWallet,
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
        location: ContentCardLocation.TopWallet,
        cardsLayout: ContentCardsLayout.carousel,
        cardsType: ContentCardsType.action,
        isDismissable: true,
      }),
    ).toBe(false);
  });

  it("returns false for unique layout or non-top_wallet placements", () => {
    expect(
      shouldShowHardwareCarouselCloseAll({
        ...baseCategory,
        location: ContentCardLocation.TopWallet,
        cardsLayout: ContentCardsLayout.unique,
        cardsType: ContentCardsType.hero,
        isDismissable: true,
      }),
    ).toBe(false);

    expect(
      shouldShowHardwareCarouselCloseAll({
        ...baseCategory,
        location: ContentCardLocation.MyLedger,
        cardsLayout: ContentCardsLayout.carousel,
        cardsType: ContentCardsType.smallSquare,
        isDismissable: true,
      }),
    ).toBe(false);
  });
});

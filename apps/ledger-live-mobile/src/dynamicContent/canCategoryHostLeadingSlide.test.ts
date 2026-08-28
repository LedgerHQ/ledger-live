import { canCategoryHostLeadingSlide } from "./canCategoryHostLeadingSlide";
import {
  CategoryContentCard,
  ContentCardLocation,
  ContentCardsLayout,
  ContentCardsType,
} from "./types";

const category = (cardsType: ContentCardsType): CategoryContentCard => ({
  id: "category-1",
  location: ContentCardLocation.TopWallet,
  type: ContentCardsType.category,
  cardsType,
  cardsLayout: ContentCardsLayout.carousel,
  createdAt: 0,
  viewed: false,
});

describe("canCategoryHostLeadingSlide", () => {
  it("allows a leading slide for action cards", () => {
    expect(canCategoryHostLeadingSlide(category(ContentCardsType.action))).toBe(true);
  });

  it.each([
    ContentCardsType.hero,
    ContentCardsType.bigSquare,
    ContentCardsType.smallSquare,
    ContentCardsType.mediumSquare,
  ])("rejects a leading slide for %s cards", cardsType => {
    expect(canCategoryHostLeadingSlide(category(cardsType))).toBe(false);
  });
});

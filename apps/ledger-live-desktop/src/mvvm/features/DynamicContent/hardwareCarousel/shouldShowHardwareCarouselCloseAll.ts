import {
  CategoryContentCard,
  ContentCardsLayout,
  ContentCardsType,
  LocationContentCard,
} from "~/types/dynamicContent";

export function shouldShowHardwareCarouselCloseAll(category: CategoryContentCard): boolean {
  return (
    category.location === LocationContentCard.Portfolio &&
    category.isDismissable === true &&
    category.cardsLayout === ContentCardsLayout.carousel &&
    category.cardsType === ContentCardsType.smallSquare
  );
}

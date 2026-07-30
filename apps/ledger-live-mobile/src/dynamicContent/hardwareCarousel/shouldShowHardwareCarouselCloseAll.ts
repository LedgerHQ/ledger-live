import {
  CategoryContentCard,
  ContentCardLocation,
  ContentCardsLayout,
  ContentCardsType,
} from "~/dynamicContent/types";

export function shouldShowHardwareCarouselCloseAll(category: CategoryContentCard): boolean {
  return (
    category.location === ContentCardLocation.TopWallet &&
    category.isDismissable === true &&
    category.cardsLayout === ContentCardsLayout.carousel &&
    category.cardsType === ContentCardsType.smallSquare
  );
}

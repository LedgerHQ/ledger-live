import {
  CategoryContentCard,
  ContentCardsLayout,
  ContentCardsType,
  LocationContentCard,
} from "~/types/dynamicContent";
import { ALWAYS_ON_CATEGORY_ID } from "../utils/constants";

export function shouldShowHardwareCarouselCloseAll(category: CategoryContentCard): boolean {
  return (
    category.categoryId === ALWAYS_ON_CATEGORY_ID &&
    category.location === LocationContentCard.Portfolio &&
    category.isDismissable === true &&
    category.cardsLayout === ContentCardsLayout.carousel &&
    category.cardsType === ContentCardsType.smallSquare
  );
}

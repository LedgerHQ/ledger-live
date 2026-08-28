import { CategoryContentCard, ContentCardsType } from "~/dynamicContent/types";

export function canCategoryHostLeadingSlide(category: CategoryContentCard): boolean {
  return category.cardsType === ContentCardsType.action;
}

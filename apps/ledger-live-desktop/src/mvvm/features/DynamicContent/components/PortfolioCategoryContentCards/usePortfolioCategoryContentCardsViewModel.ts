import { type ReactNode } from "react";

import { LocationContentCard } from "~/types/dynamicContent";
import { useFormattedCategoriesByLocation } from "../../hooks/useFormattedCategoriesByLocation";

export type UsePortfolioCategoryContentCardsViewModelArgs = Readonly<{
  leadingSlide?: ReactNode;
}>;

export type UsePortfolioCategoryContentCardsViewModelResult = Readonly<{
  categories: ReturnType<typeof useFormattedCategoriesByLocation>;
  categoryLeadingSlide?: ReactNode;
  portfolioLeadingSlide?: ReactNode;
}>;

export function usePortfolioCategoryContentCardsViewModel({
  leadingSlide,
}: UsePortfolioCategoryContentCardsViewModelArgs = {}): UsePortfolioCategoryContentCardsViewModelResult {
  const categories = useFormattedCategoriesByLocation(LocationContentCard.Portfolio);

  const hasRenderableCategoryCards = categories.length > 0;

  return {
    categories,
    categoryLeadingSlide: hasRenderableCategoryCards ? leadingSlide : undefined,
    portfolioLeadingSlide: hasRenderableCategoryCards ? undefined : leadingSlide,
  };
}

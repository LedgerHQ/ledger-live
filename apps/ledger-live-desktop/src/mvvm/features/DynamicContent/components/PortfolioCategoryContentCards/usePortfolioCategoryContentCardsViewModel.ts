import { LocationContentCard } from "~/types/dynamicContent";
import { useFormattedCategoriesByLocation } from "../../hooks/useFormattedCategoriesByLocation";

export type UsePortfolioCategoryContentCardsViewModelResult = Readonly<{
  categories: ReturnType<typeof useFormattedCategoriesByLocation>;
}>;

export function usePortfolioCategoryContentCardsViewModel(): UsePortfolioCategoryContentCardsViewModelResult {
  const categories = useFormattedCategoriesByLocation(LocationContentCard.Portfolio);

  return { categories };
}

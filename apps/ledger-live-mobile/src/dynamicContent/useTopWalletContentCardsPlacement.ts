import { canCategoryHostLeadingSlide } from "./canCategoryHostLeadingSlide";
import { ContentCardLocation } from "./types";
import useDynamicContent from "./useDynamicContent";
import { filterCategoriesByLocation, formatCategories } from "./utils";

type TopWalletContentCardsPlacement = {
  hasDisplayableCards: boolean;
  canHostLeadingSlide: boolean;
};

export function useTopWalletContentCardsPlacement(): TopWalletContentCardsPlacement {
  const { categoriesCards, mobileCards } = useDynamicContent();

  const categories = formatCategories(
    filterCategoriesByLocation(categoriesCards, ContentCardLocation.TopWallet),
    mobileCards,
  );

  return {
    hasDisplayableCards: categories.length > 0,
    canHostLeadingSlide: Boolean(
      categories[0] && canCategoryHostLeadingSlide(categories[0].category),
    ),
  };
}

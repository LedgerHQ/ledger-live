import useDynamicContent from "./useDynamicContent";
import { ContentCardLocation } from "./types";
import { filterCategoriesByLocation, formatCategories } from "./utils";

export function useTopWalletHasDisplayableContentCards(): boolean {
  const { categoriesCards, mobileCards } = useDynamicContent();

  const formatted = formatCategories(
    filterCategoriesByLocation(categoriesCards, ContentCardLocation.TopWallet),
    mobileCards,
  );

  return formatted.length > 0;
}

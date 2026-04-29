import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import useDynamicContent from "./useDynamicContent";
import { ContentCardLocation } from "./types";
import { filterCategoriesByLocation, formatCategories } from "./utils";

export function useTopWalletHasDisplayableContentCards(): boolean {
  const flexibleContentCards = useFeature("flexibleContentCards");
  const { categoriesCards, mobileCards } = useDynamicContent();

  if (!flexibleContentCards?.enabled) {
    return false;
  }

  const formatted = formatCategories(
    filterCategoriesByLocation(categoriesCards, ContentCardLocation.TopWallet),
    mobileCards,
  );

  return formatted.length > 0;
}

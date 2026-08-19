import { useFormattedCategoriesByLocation } from "../../hooks/useFormattedCategoriesByLocation";
import type { FormattedCategory } from "../../utils/categories";
import { LocationContentCard } from "~/types/dynamicContent";

export type UseContentCardsLocationViewModelArgs = Readonly<{
  locationId: LocationContentCard;
  enabled?: boolean;
}>;

export type UseContentCardsLocationViewModelResult = Readonly<{
  categories: FormattedCategory[];
}>;

export function useContentCardsLocationViewModel({
  locationId,
  enabled = true,
}: UseContentCardsLocationViewModelArgs): UseContentCardsLocationViewModelResult {
  const categories = useFormattedCategoriesByLocation(locationId, { enabled });

  return { categories };
}

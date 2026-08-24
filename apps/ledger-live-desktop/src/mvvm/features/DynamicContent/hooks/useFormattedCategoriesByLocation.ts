import { useMemo } from "react";

import { LocationContentCard } from "~/types/dynamicContent";
import {
  getRenderableFormattedCategoriesByLocation,
  type FormattedCategory,
} from "../utils/categories";
import { useDynamicContent } from "./useDynamicContent";

type UseFormattedCategoriesByLocationOptions = Readonly<{
  enabled?: boolean;
}>;

export function useFormattedCategoriesByLocation(
  locationId: LocationContentCard,
  { enabled = true }: UseFormattedCategoriesByLocationOptions = {},
): FormattedCategory[] {
  const { categoriesCards, categoryChildCards } = useDynamicContent();

  return useMemo(() => {
    if (!enabled) {
      return [];
    }

    return getRenderableFormattedCategoriesByLocation(
      categoriesCards,
      categoryChildCards,
      locationId,
    );
  }, [categoriesCards, categoryChildCards, enabled, locationId]);
}

import React from "react";

import type { LocationContentCard } from "~/types/dynamicContent";
import type { FormattedCategory } from "../../utils/categories";
import ContentCardsCategory from "../ContentCardsCategory";
import { useContentCardsLocationViewModel } from "./useContentCardsLocationViewModel";

type ContentCardsLocationProps = Readonly<{
  locationId: LocationContentCard;
  leadingSlide?: React.ReactNode;
  categories?: FormattedCategory[];
}>;

export default ContentCardsLocation;

function ContentCardsLocation({
  locationId,
  leadingSlide,
  categories: categoriesOverride,
}: ContentCardsLocationProps) {
  const { categories: categoriesFromViewModel } = useContentCardsLocationViewModel({
    locationId,
    enabled: categoriesOverride === undefined,
  });
  const categories = categoriesOverride ?? categoriesFromViewModel;

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-32" data-testid="content-cards-location">
      {categories.map(({ category, cards }, index) => (
        <ContentCardsCategory
          key={category.id}
          category={category}
          categoryContentCards={cards}
          leadingSlide={index === 0 ? leadingSlide : undefined}
        />
      ))}
    </div>
  );
}

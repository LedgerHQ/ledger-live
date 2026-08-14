import React, { memo, type ReactNode } from "react";

import ContentCardsLocation from "../ContentCardsLocation";
import PortfolioContentCards from "../PortfolioContentCards";
import { LocationContentCard } from "~/types/dynamicContent";
import { usePortfolioCategoryContentCardsViewModel } from "./usePortfolioCategoryContentCardsViewModel";

type PortfolioCategoryContentCardsProps = Readonly<{
  leadingSlide?: ReactNode;
}>;

function PortfolioCategoryContentCards({ leadingSlide }: PortfolioCategoryContentCardsProps) {
  const { categories, categoryLeadingSlide, portfolioLeadingSlide } =
    usePortfolioCategoryContentCardsViewModel({ leadingSlide });

  return (
    <div className="flex flex-col gap-16">
      <ContentCardsLocation
        locationId={LocationContentCard.Portfolio}
        leadingSlide={categoryLeadingSlide}
        categories={categories}
      />
      <PortfolioContentCards leadingSlide={portfolioLeadingSlide} />
    </div>
  );
}

export default memo(PortfolioCategoryContentCards);

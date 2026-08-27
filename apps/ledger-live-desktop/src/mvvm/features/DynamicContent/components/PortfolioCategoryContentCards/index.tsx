import React, { memo, type ReactNode } from "react";

import ContentCardsLocation from "../ContentCardsLocation";
import PortfolioContentCards from "../PortfolioContentCards";
import { LocationContentCard } from "~/types/dynamicContent";
import { usePortfolioCategoryContentCardsViewModel } from "./usePortfolioCategoryContentCardsViewModel";

type PortfolioCategoryContentCardsProps = Readonly<{
  leadingSlide?: ReactNode;
}>;

function PortfolioCategoryContentCards({ leadingSlide }: PortfolioCategoryContentCardsProps) {
  const { categories } = usePortfolioCategoryContentCardsViewModel();

  if (categories.length === 0) {
    return <PortfolioContentCards leadingSlide={leadingSlide} />;
  }

  return (
    <div className="flex flex-col gap-16">
      <PortfolioContentCards leadingSlide={leadingSlide} />
      <ContentCardsLocation locationId={LocationContentCard.Portfolio} categories={categories} />
    </div>
  );
}

export default memo(PortfolioCategoryContentCards);

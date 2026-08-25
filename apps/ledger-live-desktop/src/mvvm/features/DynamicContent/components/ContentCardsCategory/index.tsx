import React, { useCallback } from "react";
import type { Card as BrazeCard } from "@braze/web-sdk";
import type { CategoryContentCard } from "~/types/dynamicContent";
import LogContentCardWrapper from "../LogContentCardWrapper";
import { shouldShowHardwareCarouselCloseAll } from "../../hardwareCarousel/shouldShowHardwareCarouselCloseAll";
import { useHardwareCarouselPageTracking } from "../../hardwareCarousel/useHardwareCarouselPageTracking";
import Header from "./Header";
import Layout from "./Layout";
import {
  useContentCardsCategoryViewModel,
  type MappedCategorySlide,
} from "./useContentCardsCategoryViewModel";

type ContentCardsCategoryProps = Readonly<{
  category: CategoryContentCard;
  categoryContentCards: BrazeCard[];
  leadingSlide?: React.ReactNode;
}>;

export default ContentCardsCategory;

function ContentCardsCategory({
  category,
  categoryContentCards,
  leadingSlide,
}: ContentCardsCategoryProps) {
  const isHardwareCarousel = shouldShowHardwareCarouselCloseAll(category);
  const hardwareCarouselSharedProps = useHardwareCarouselPageTracking(isHardwareCarousel);

  const {
    title,
    cta,
    centered,
    leadingSlide: leading,
    slides,
    isDismissable,
    closeAllCardIds,
    onHeaderCtaPress,
    onCardClick,
    onCardDismiss,
  } = useContentCardsCategoryViewModel({
    category,
    categoryContentCards,
    leadingSlide,
    hardwareCarouselSharedProps: isHardwareCarousel ? hardwareCarouselSharedProps : undefined,
  });

  const handleCardClick = useCallback(
    (slide: MappedCategorySlide) => onCardClick(slide.card, slide.displayedPosition),
    [onCardClick],
  );

  const handleCardDismiss = useCallback(
    (slide: MappedCategorySlide) => onCardDismiss(slide.card, slide.displayedPosition),
    [onCardDismiss],
  );

  if (slides.length === 0) {
    return null;
  }

  return (
    <LogContentCardWrapper id={category.id} location={category.location}>
      <div className="flex w-full flex-col" data-testid="content-cards-category">
        <Header
          title={title}
          cta={cta}
          centered={centered}
          closeAllCardIds={closeAllCardIds}
          onCtaPress={onHeaderCtaPress}
        />
        <Layout
          category={category}
          slides={slides}
          isDismissable={isDismissable}
          leadingSlide={leading}
          onCardClick={handleCardClick}
          onCardDismiss={handleCardDismiss}
        />
      </div>
    </LogContentCardWrapper>
  );
}

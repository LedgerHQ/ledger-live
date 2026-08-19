import React from "react";

import type { CategoryContentCard } from "~/types/dynamicContent";
import type { MappedCategorySlide } from "./useContentCardsCategoryViewModel";
import LogContentCardWrapper from "../LogContentCardWrapper";
import SmallSquareCard from "../SmallSquareCard";
import CategoryCarousel from "./CategoryCarousel";

type LayoutProps = Readonly<{
  category: CategoryContentCard;
  slides: MappedCategorySlide[];
  isDismissable: boolean;
  leadingSlide?: React.ReactNode;
  onCardClick: (slide: MappedCategorySlide) => void;
  onCardDismiss: (slide: MappedCategorySlide) => void;
}>;

export default function Layout({
  category,
  slides,
  isDismissable,
  leadingSlide,
  onCardClick,
  onCardDismiss,
}: LayoutProps) {
  const carouselSlides = slides.map(slide => (
    <LogContentCardWrapper
      key={slide.card.id}
      id={slide.card.id}
      displayedPosition={slide.displayedPosition}
      location={slide.card.location ?? category.location}
    >
      <SmallSquareCard
        title={slide.card.title}
        subDescription={slide.card.subDescription}
        tag={slide.card.tag}
        media={slide.card.media}
        mediaType={slide.card.mediaType}
        filledMedia={slide.card.filledMedia}
        isDismissable={isDismissable}
        onClick={slide.card.link ? () => onCardClick(slide) : undefined}
        onDismiss={isDismissable ? () => onCardDismiss(slide) : undefined}
      />
    </LogContentCardWrapper>
  ));

  return <CategoryCarousel slides={carouselSlides} leadingSlide={leadingSlide} />;
}

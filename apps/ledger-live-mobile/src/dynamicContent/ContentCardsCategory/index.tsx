import React, { useMemo } from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import LogContentCardWrapper from "LLM/features/DynamicContent/components/LogContentCardWrapper";
import { shouldShowHardwareCarouselCloseAll } from "~/dynamicContent/hardwareCarousel/shouldShowHardwareCarouselCloseAll";
import { useHardwareCarouselPageTracking } from "~/dynamicContent/hardwareCarousel/useHardwareCarouselPageTracking";
import { CategoryContentCard, BrazeContentCard } from "../types";
import Header from "./Header";
import Layout from "./Layout";

type Props = {
  category: CategoryContentCard;
  categoryContentCards: BrazeContentCard[];
  leadingSlide?: React.ReactNode;
};

const ContentCardsCategory = ({ category, categoryContentCards, leadingSlide }: Props) => {
  const isHardwareCarousel = shouldShowHardwareCarouselCloseAll(category);
  const hardwareCarouselSharedProps = useHardwareCarouselPageTracking(isHardwareCarousel);

  const closeAllCardIds = useMemo(() => {
    if (!isHardwareCarousel) {
      return undefined;
    }

    return categoryContentCards.map(card => card.id);
  }, [isHardwareCarousel, categoryContentCards]);

  return (
    <LogContentCardWrapper id={category.id} location={category.location}>
      <Box>
        <Header
          title={category.title}
          description={category.description}
          cta={category.cta}
          link={category.link}
          centered={category.centeredText}
          closeAllCardIds={closeAllCardIds}
        />
        <Layout
          category={category}
          cards={categoryContentCards}
          leadingSlide={leadingSlide}
          hardwareCarouselSharedProps={isHardwareCarousel ? hardwareCarouselSharedProps : undefined}
        />
      </Box>
    </LogContentCardWrapper>
  );
};

export default ContentCardsCategory;

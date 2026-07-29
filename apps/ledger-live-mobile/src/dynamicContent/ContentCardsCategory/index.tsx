import React, { useMemo } from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import LogContentCardWrapper from "LLM/features/DynamicContent/components/LogContentCardWrapper";
import { useHardwareCarouselCloseAll } from "~/dynamicContent/hardwareCarousel/useHardwareCarouselCloseAll";
import { shouldShowHardwareCarouselCloseAll } from "~/dynamicContent/hardwareCarousel/shouldShowHardwareCarouselCloseAll";
import { CategoryContentCard, BrazeContentCard } from "../types";
import Header from "./Header";
import Layout from "./Layout";

type Props = {
  category: CategoryContentCard;
  categoryContentCards: BrazeContentCard[];
};

const ContentCardsCategory = ({ category, categoryContentCards }: Props) => {
  const cardIds = useMemo(
    () => categoryContentCards.map(card => card.id),
    [categoryContentCards],
  );
  const showCloseAll = shouldShowHardwareCarouselCloseAll(category);
  const handleCloseAll = useHardwareCarouselCloseAll(cardIds);

  return (
    <LogContentCardWrapper id={category.id} location={category.location}>
      <Box>
        <Header
          title={category.title}
          description={category.description}
          cta={category.cta}
          link={category.link}
          centered={category.centeredText}
          showCloseAll={showCloseAll}
          onCloseAll={handleCloseAll}
        />
        <Layout category={category} cards={categoryContentCards} />
      </Box>
    </LogContentCardWrapper>
  );
};

export default ContentCardsCategory;

import React, { useMemo } from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import LogContentCardWrapper from "LLM/features/DynamicContent/components/LogContentCardWrapper";
import { shouldShowHardwareCarouselCloseAll } from "~/dynamicContent/hardwareCarousel/shouldShowHardwareCarouselCloseAll";
import { CategoryContentCard, BrazeContentCard } from "../types";
import Header from "./Header";
import Layout from "./Layout";

type Props = {
  category: CategoryContentCard;
  categoryContentCards: BrazeContentCard[];
};

const ContentCardsCategory = ({ category, categoryContentCards }: Props) => {
  const closeAllCardIds = useMemo(() => {
    if (!shouldShowHardwareCarouselCloseAll(category)) {
      return undefined;
    }

    return categoryContentCards.map(card => card.id);
  }, [category, categoryContentCards]);

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
        <Layout category={category} cards={categoryContentCards} />
      </Box>
    </LogContentCardWrapper>
  );
};

export default ContentCardsCategory;

import React, {
  cloneElement,
  isValidElement,
  memo,
  useMemo,
  type ReactElement,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router";
import styled from "styled-components";

import { Carousel } from "@ledgerhq/react-ui";
import { track } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import type { PortfolioContentCard as PortfolioCardType } from "~/types/dynamicContent";
import type { CarouselActions } from "../../types";
import { ContentBannerActionCard } from "../ContentBannerActionCard";
import LogContentCardWrapper from "../LogContentCardWrapper";
import Slide from "./Slide";
import { usePortfolioContentCardsViewModel } from "./usePortfolioContentCardsViewModel";

export default PortfolioContentCards;

const CarouselWrapper = styled.div`
  & > div > div > button {
    translate: 0 -50%;
    margin: 0 -12px;
    background-color: ${({ theme }) => theme.colors.neutral.c00};
  }
`;

/** 2 columns, max 2 cards (Braze placement portfolio) */
const BrazePlacementGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  width: 100%;
  & > * {
    min-width: 0;
  }
`;

const LeadingGridCell = styled.div`
  min-width: 0;
  width: 100%;
`;

const StackedLeading = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

type BrazeSlideProps = {
  card: PortfolioCardType;
  /** Index into `portfolioCards` for dismiss. */
  index: number;
  /** Visual position for analytics (may include a leading upsell offset). */
  displayedPosition?: number;
} & CarouselActions;

/** MediaBanner URL from `image_background` only (`image` is not used as fallback). */
function lumenImageBackgroundForPortfolio(card: PortfolioCardType): string | undefined {
  const bg = card.image_background?.trim();
  return bg || undefined;
}

/** Fill the grid cell: LNSUpsellBanner Flex defaults to 50% for exclusive display. */
function leadingSlideForGrid(leading: ReactNode): ReactNode {
  if (!isValidElement(leading)) return leading;
  return cloneElement(leading as ReactElement<{ width?: string; maxWidth?: string }>, {
    width: "100%",
    maxWidth: "100%",
  });
}

const PortfolioBrazePlacementSlide = memo(function PortfolioBrazePlacementSlide({
  card,
  index,
  displayedPosition,
  logSlideClick,
  dismissCard,
}: BrazeSlideProps) {
  const navigate = useNavigate();
  const analyticsPosition = displayedPosition ?? index;

  const handleClose = () => dismissCard(index, analyticsPosition);
  const handleClick = () => {
    logSlideClick(card.id, analyticsPosition);
    if (card.path) {
      navigate(card.path, { state: { source: "banner" } });
    } else if (card.url) {
      openURL(card.url);
    }
  };

  const imageBackground = lumenImageBackgroundForPortfolio(card);

  return (
    <LogContentCardWrapper
      id={card.id}
      displayedPosition={analyticsPosition}
      location={card.location}
    >
      <ContentBannerActionCard
        title={card.title}
        description={card.description}
        onClose={handleClose}
        onClick={handleClick}
        icon={card.icon}
        image_background={imageBackground}
      />
    </LogContentCardWrapper>
  );
});

type PortfolioContentCardsProps = Readonly<{
  leadingSlide?: ReactNode;
}>;

function PortfolioContentCards({ leadingSlide }: PortfolioContentCardsProps) {
  const { layout, brazeCarouselEntries, positionOffset, logSlideClick, dismissCard } =
    usePortfolioContentCardsViewModel({ hasLeadingSlide: Boolean(leadingSlide) });

  const handlePrevButton = () => trackSlide("prev");
  const handleNextButton = () => trackSlide("next");

  const brazeSlides = useMemo(
    () =>
      brazeCarouselEntries.map(({ card, portfolioIndex }, displayIndex) => (
        <Slide
          key={card.id}
          {...card}
          index={portfolioIndex}
          displayedPosition={displayIndex + positionOffset}
          logSlideClick={logSlideClick}
          dismissCard={dismissCard}
        />
      )),
    [brazeCarouselEntries, dismissCard, logSlideClick, positionOffset],
  );

  // Carousel requires ReactElement[] (uses children.length / .map) — not a Fragment.
  const renderCarousel = (slides: ReactElement[]) => (
    <CarouselWrapper>
      <Carousel
        initialDelay={2500}
        autoPlay={6000}
        onPrev={handlePrevButton}
        onNext={handleNextButton}
      >
        {slides}
      </Carousel>
    </CarouselWrapper>
  );

  if (layout === "empty") return null;

  if (layout === "leading-only") {
    return <>{leadingSlide}</>;
  }

  if (layout === "braze-grid") {
    return (
      <BrazePlacementGrid>
        {leadingSlide ? (
          <LeadingGridCell key="portfolio-upsell-leading">
            {leadingSlideForGrid(leadingSlide)}
          </LeadingGridCell>
        ) : null}
        {brazeCarouselEntries.map(({ card, portfolioIndex }, displayIndex) => (
          <PortfolioBrazePlacementSlide
            key={card.id}
            card={card}
            index={portfolioIndex}
            displayedPosition={displayIndex + positionOffset}
            logSlideClick={logSlideClick}
            dismissCard={dismissCard}
          />
        ))}
      </BrazePlacementGrid>
    );
  }

  if (layout === "stacked-leading") {
    return (
      <StackedLeading>
        {leadingSlide}
        {renderCarousel(brazeSlides)}
      </StackedLeading>
    );
  }

  return renderCarousel(brazeSlides);
}

function trackSlide(button: "prev" | "next") {
  track("contentcards_slide", { button, page: "Portfolio", type: "carousel_portfolio" });
}

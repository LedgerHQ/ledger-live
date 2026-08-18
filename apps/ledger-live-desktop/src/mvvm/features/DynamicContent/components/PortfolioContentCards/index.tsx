import React, {
  cloneElement,
  isValidElement,
  memo,
  useMemo,
  type ReactElement,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router";

import { Carousel } from "@ledgerhq/react-ui";
import { track } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import type { PortfolioContentCard as PortfolioCardType } from "~/types/dynamicContent";
import type { CarouselActions } from "../../types";
import {
  BRAZE_PLACEMENT_CONTAINER_CLASS_NAME,
  BRAZE_PLACEMENT_GRID_CLASS_NAME,
} from "../../utils/brazePlacementLayout";
import { ContentBannerActionCard } from "../ContentBannerActionCard";
import LogContentCardWrapper from "../LogContentCardWrapper";
import Slide from "./Slide";
import { usePortfolioContentCardsViewModel } from "./usePortfolioContentCardsViewModel";

export default PortfolioContentCards;

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
    usePortfolioContentCardsViewModel({
      hasLeadingSlide: Boolean(leadingSlide),
    });

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
    <div className="[&_[data-testid=carousel-arrow-prev]]:-ml-12 [&_[data-testid=carousel-arrow-next]]:-mr-12 [&_[data-testid^=carousel-arrow]]:bg-base">
      <Carousel
        initialDelay={2500}
        autoPlay={6000}
        onPrev={handlePrevButton}
        onNext={handleNextButton}
      >
        {slides}
      </Carousel>
    </div>
  );

  if (layout === "empty") return null;

  if (layout === "leading-only") {
    return <>{leadingSlide}</>;
  }

  if (layout === "braze-grid") {
    return (
      <div className={BRAZE_PLACEMENT_CONTAINER_CLASS_NAME}>
        <div
          className={BRAZE_PLACEMENT_GRID_CLASS_NAME}
          data-testid="portfolio-braze-placement-grid"
        >
          {leadingSlide ? (
            <div className="min-w-0 w-full" key="portfolio-upsell-leading">
              {leadingSlideForGrid(leadingSlide)}
            </div>
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
        </div>
      </div>
    );
  }

  if (layout === "stacked-leading") {
    return (
      <div className="flex w-full flex-col gap-16">
        {leadingSlide}
        {renderCarousel(brazeSlides)}
      </div>
    );
  }

  return renderCarousel(brazeSlides);
}

function trackSlide(button: "prev" | "next") {
  track("contentcards_slide", { button, page: "Portfolio", type: "carousel_portfolio" });
}

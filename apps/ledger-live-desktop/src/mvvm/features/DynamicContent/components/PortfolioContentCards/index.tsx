import React, { memo } from "react";
import { useNavigate } from "react-router";
import styled from "styled-components";

import { Carousel } from "@ledgerhq/react-ui";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { track } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import type { PortfolioContentCard as PortfolioCardType } from "~/types/dynamicContent";
import { usePortfolioCarouselCards } from "../../hooks/usePortfolioCarouselCards";
import type { CarouselActions } from "../../types";
import { ContentBannerActionCard } from "../ContentBannerActionCard";
import LogContentCardWrapper from "../LogContentCardWrapper";
import Slide from "./Slide";

export default PortfolioContentCards;

const CarouselWrapper = styled.div<{ $isWallet40Enabled: boolean }>`
  & > div > div > button {
    ${({ $isWallet40Enabled, theme }) =>
      $isWallet40Enabled &&
      `
      translate: 0 -50%;
      margin: 0 -12px;
      background-color: ${theme.colors.neutral.c00};
    `}
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

type BrazeSlideProps = {
  card: PortfolioCardType;
  index: number;
} & CarouselActions;

/** Braze placement grid: only cards with at least one of these (extras) are shown when FF is on. */
function isPortfolioCardEligibleForLumenGrid(card: PortfolioCardType): boolean {
  return Boolean(card.image_background?.trim()) || Boolean(card.icon?.trim());
}

/** MediaBanner URL from `image_background` only (`image` is not used as fallback). */
function lumenImageBackgroundForPortfolio(card: PortfolioCardType): string | undefined {
  const bg = card.image_background?.trim();
  return bg || undefined;
}

const PortfolioBrazePlacementSlide = memo(function PortfolioBrazePlacementSlide({
  card,
  index,
  logSlideClick,
  dismissCard,
}: BrazeSlideProps) {
  const navigate = useNavigate();

  const handleClose = () => dismissCard(index);
  const handleClick = () => {
    logSlideClick(card.id);
    if (card.path) {
      navigate(card.path, { state: { source: "banner" } });
    } else if (card.url) {
      openURL(card.url);
    }
  };

  const imageBackground = lumenImageBackgroundForPortfolio(card);

  return (
    <LogContentCardWrapper id={card.id} location={card.location}>
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

function PortfolioContentCards() {
  const { portfolioCards, logSlideClick, dismissCard } = usePortfolioCarouselCards("top");
  const { isEnabled: isWallet40Enabled, shouldDisplayBrazePlacement } =
    useWalletFeaturesConfig("desktop");
  const handlePrevButton = () => trackSlide("prev");
  const handleNextButton = () => trackSlide("next");

  if (portfolioCards.length === 0) return null;

  if (shouldDisplayBrazePlacement) {
    const eligibleEntries = portfolioCards
      .map((card, portfolioIndex) => ({ card, portfolioIndex }))
      .filter(({ card }) => isPortfolioCardEligibleForLumenGrid(card))
      .slice(0, 2);

    if (eligibleEntries.length === 0) return null;

    return (
      <BrazePlacementGrid>
        {eligibleEntries.map(({ card, portfolioIndex }) => (
          <PortfolioBrazePlacementSlide
            key={card.id}
            card={card}
            index={portfolioIndex}
            logSlideClick={logSlideClick}
            dismissCard={dismissCard}
          />
        ))}
      </BrazePlacementGrid>
    );
  }

  return (
    <CarouselWrapper $isWallet40Enabled={isWallet40Enabled}>
      <Carousel
        initialDelay={2500}
        autoPlay={6000}
        onPrev={handlePrevButton}
        onNext={handleNextButton}
      >
        {portfolioCards.map((card, index) => (
          <Slide
            key={card.id}
            {...card}
            index={index}
            logSlideClick={logSlideClick}
            dismissCard={dismissCard}
            isWallet40Enabled={isWallet40Enabled}
          />
        ))}
      </Carousel>
    </CarouselWrapper>
  );
}

function trackSlide(button: "prev" | "next") {
  track("contentcards_slide", { button, page: "Portfolio", type: "carousel_portfolio" });
}

import React from "react";
import styled from "styled-components";

import { Carousel } from "@ledgerhq/react-ui";
import { track } from "~/renderer/analytics/segment";
import { usePortfolioCards } from "../../hooks/usePortfolioCards";
import Slide from "./Slide";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";

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

function PortfolioContentCards() {
  const { portfolioCards, logSlideClick, dismissCard } = usePortfolioCards();
  const { isEnabled: isWallet40Enabled } = useWalletFeaturesConfig("desktop");
  const handlePrevButton = () => trackSlide("prev");
  const handleNextButton = () => trackSlide("next");

  if (portfolioCards.length === 0) return null;

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
  track("contentcards_slide", { button, page: "Portfolio", type: "portfolio_carousel" });
}

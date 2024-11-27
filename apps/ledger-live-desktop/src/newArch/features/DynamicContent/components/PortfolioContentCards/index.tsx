import React from "react";

import { Carousel } from "@ledgerhq/react-ui";
import { track } from "~/renderer/analytics/segment";
import { usePortfolioCards } from "../../hooks/usePortfolioCards";
import Slide from "./Slide";

export default PortfolioContentCards;

function PortfolioContentCards() {
  const { portfolioCards, logSlideClick, dismissCard } = usePortfolioCards();
  const handlePrevButton = () => trackSlide("prev");
  const handleNextButton = () => trackSlide("next");

  return (
    <Carousel autoPlay={6000} onPrev={handlePrevButton} onNext={handleNextButton}>
      {portfolioCards.map((card, index) => (
        <Slide
          key={card.id}
          {...card}
          index={index}
          logSlideClick={logSlideClick}
          dismissCard={dismissCard}
        />
      ))}
    </Carousel>
  );
}

function trackSlide(button: "prev" | "next") {
  track("contentcards_slide", { button, page: "Portfolio", type: "portfolio_carousel" });
}

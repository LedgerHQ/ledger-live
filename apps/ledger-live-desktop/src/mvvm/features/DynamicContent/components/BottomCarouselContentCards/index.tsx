import React from "react";

import { usePortfolioCarouselCards } from "../../hooks/usePortfolioCarouselCards";

import BottomCarouselSlide from "./BottomCarouselSlide";

export const BottomCarouselContentCards = () => {
  const { portfolioCards, logSlideClick, dismissCard } = usePortfolioCarouselCards("bottom");

  if (portfolioCards.length === 0) return null;

  return (
    <div data-testid="bottom-carousel-content-cards">
      <div
        data-testid="scroll-container"
        className="scrollbar-none flex flex-col overflow-x-scroll py-2"
      >
        <div className="flex items-stretch gap-14">
          {portfolioCards.map((card, index) => (
            <div key={card.id} className="shrink-0 min-w-[280px] w-[280px]">
              <BottomCarouselSlide
                {...card}
                index={index}
                logSlideClick={logSlideClick}
                dismissCard={dismissCard}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

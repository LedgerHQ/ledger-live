import React from "react";

import { cn } from "LLD/utils/cn";
import { usePortfolioCarouselCards } from "../../hooks/usePortfolioCarouselCards";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";

import BottomCarouselSlide from "./BottomCarouselSlide";

export const BottomCarouselContentCards = () => {
  const { portfolioCards, logSlideClick, dismissCard } = usePortfolioCarouselCards("bottom");
  const { isEnabled: isWallet40Enabled } = useWalletFeaturesConfig("desktop");

  if (portfolioCards.length === 0) return null;

  return (
    <div data-testid="bottom-carousel-content-cards">
      <div
        data-testid="scroll-container"
        className="scrollbar-none flex flex-col overflow-x-scroll py-2"
      >
        <div className="flex items-stretch gap-14">
          {portfolioCards.map((card, index) => (
            <div
              key={card.id}
              className={cn(
                "shrink-0 min-w-[280px] w-[280px]",
                isWallet40Enabled && "overflow-hidden rounded-xl",
              )}
            >
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

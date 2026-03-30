// Temporary component to display the bottom carousel content cards
// TODO: Remove this component and use the Lumen bottom carousel component when available

import React from "react";

import { cn } from "LLD/utils/cn";
import { usePortfolioCarouselCards } from "../../hooks/usePortfolioCarouselCards";
import Slide from "../PortfolioContentCards/Slide";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";

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
        <div className="flex items-stretch gap-4">
          {portfolioCards.map((card, index) => (
            <div
              key={card.id}
              className={cn(
                "shrink-0 min-w-[280px] w-[280px]",
                isWallet40Enabled && "overflow-hidden rounded-xl",
              )}
            >
              <Slide
                {...card}
                index={index}
                logSlideClick={logSlideClick}
                dismissCard={dismissCard}
                isWallet40Enabled={isWallet40Enabled}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

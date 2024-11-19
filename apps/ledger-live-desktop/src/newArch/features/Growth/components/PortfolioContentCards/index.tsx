import React from "react";

import { Carousel } from "@ledgerhq/react-ui";
import { usePortfolioCards } from "../../hooks/usePortfolioCards";
import Slide from "./Slide";

const PortfolioContentCards = () => {
  const { portfolioCards, logSlideClick, logSlideImpression, dismissCard } = usePortfolioCards();
  return (
    <Carousel autoPlay={6000} onChange={logSlideImpression}>
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
};

export default PortfolioContentCards;

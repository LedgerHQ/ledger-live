import React from "react";
import { MarketTopCardsSection } from "./MarketTopCardsSection";
import { GlobalMarketCapCard } from "./components/GlobalMarketCapCard";
import { MoodIndexCard } from "./components/MoodIndexCard";
import { AltSeasonIndexCard } from "./components/AltSeasonIndexCard";

function MarketTopCards() {
  return (
    <MarketTopCardsSection>
      <GlobalMarketCapCard />
      <MoodIndexCard />
      <AltSeasonIndexCard />
    </MarketTopCardsSection>
  );
}

export { MarketTopCardsSection };
export default MarketTopCards;

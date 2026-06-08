import React from "react";
import { MarketTopCardsSection } from "./MarketTopCardsSection";
import { MarketTopCardPlaceholder } from "./components/MarketTopCardPlaceholder";
import { GlobalMarketCapCard } from "./components/GlobalMarketCapCard";
import { MoodIndexCard } from "./components/MoodIndexCard";
import { useMarketTopCardsViewModel } from "./hooks/useMarketTopCardsViewModel";

function MarketTopCards() {
  const { shouldRender } = useMarketTopCardsViewModel();

  if (!shouldRender) return null;

  return (
    <MarketTopCardsSection>
      <GlobalMarketCapCard />
      <MoodIndexCard />
      <MarketTopCardPlaceholder testId="market-top-card-3" />
    </MarketTopCardsSection>
  );
}

export { MarketTopCardsSection };
export default MarketTopCards;

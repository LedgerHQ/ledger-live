import React from "react";
import { MarketTopCardError } from "../MarketTopCardError";
import { MarketTopCardPlaceholder } from "../MarketTopCardPlaceholder";
import { GlobalMarketCapCardView } from "./GlobalMarketCapCardView";
import { useGlobalMarketCapViewModel } from "./hooks/useGlobalMarketCapViewModel";

export function GlobalMarketCapCard() {
  const { value, changePercentage, isLoading, isError, onClick } = useGlobalMarketCapViewModel();

  if (isLoading) {
    return <MarketTopCardPlaceholder testId="market-top-card-1" />;
  }

  if (isError) {
    return (
      <MarketTopCardError
        testId="market-top-card-1"
        titleKey="market.topCards.globalMarketCap.title"
        hasTrailing={false}
      />
    );
  }

  return (
    <GlobalMarketCapCardView value={value} changePercentage={changePercentage} onClick={onClick} />
  );
}

import React from "react";
import { MarketTopCardPlaceholder } from "../MarketTopCardPlaceholder";
import { GlobalMarketCapCardView } from "./GlobalMarketCapCardView";
import { useGlobalMarketCapViewModel } from "./hooks/useGlobalMarketCapViewModel";

export function GlobalMarketCapCard() {
  const { value, changePercentage, isLoading, isError, onClick } = useGlobalMarketCapViewModel();

  if (isLoading) {
    return <MarketTopCardPlaceholder testId="market-top-card-1" />;
  }

  if (isError) {
    return null;
  }

  return (
    <GlobalMarketCapCardView value={value} changePercentage={changePercentage} onClick={onClick} />
  );
}

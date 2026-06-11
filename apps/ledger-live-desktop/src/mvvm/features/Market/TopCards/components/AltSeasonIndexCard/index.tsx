import React from "react";
import { MarketTopCardError } from "../MarketTopCardError";
import { MarketTopCardPlaceholder } from "../MarketTopCardPlaceholder";
import { AltSeasonIndexCardView } from "./AltSeasonIndexCardView";
import { useAltSeasonIndexViewModel } from "./hooks/useAltSeasonIndexViewModel";

export function AltSeasonIndexCard() {
  const { data, label, isError, isLoading, onClick } = useAltSeasonIndexViewModel();

  if (isLoading) {
    return <MarketTopCardPlaceholder testId="market-top-card-3" />;
  }

  if (isError || !data) {
    return (
      <MarketTopCardError testId="market-top-card-3" titleKey="market.topCards.altSeason.title" />
    );
  }

  return <AltSeasonIndexCardView value={data.value} label={label} onClick={onClick} />;
}

import React from "react";
import { MarketTopCardPlaceholder } from "../MarketTopCardPlaceholder";
import { MoodIndexCardView } from "./MoodIndexCardView";
import { useMoodIndexCardViewModel } from "./hooks/useMoodIndexCardViewModel";

export function MoodIndexCard() {
  const { data, isError, isLoading, onClick } = useMoodIndexCardViewModel();

  if (isLoading) {
    return <MarketTopCardPlaceholder testId="market-top-card-2" />;
  }

  // Scoped error: keep the row intact, just don't render this card.
  if (isError || !data) {
    return null;
  }

  return <MoodIndexCardView data={data} onClick={onClick} />;
}

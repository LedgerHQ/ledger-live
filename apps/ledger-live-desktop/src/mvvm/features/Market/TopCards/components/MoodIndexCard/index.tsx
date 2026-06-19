import React from "react";
import { useMoodIndexAvailability } from "LLD/features/FearAndGreed/hooks/useMoodIndexAvailability";
import { MarketTopCardError } from "../MarketTopCardError";
import { MarketTopCardPlaceholder } from "../MarketTopCardPlaceholder";
import { MoodIndexCardView } from "./MoodIndexCardView";
import { useMoodIndexCardViewModel } from "./hooks/useMoodIndexCardViewModel";

function MoodIndexCardContent() {
  const { data, isError, isLoading, onClick } = useMoodIndexCardViewModel();

  if (isLoading) {
    return <MarketTopCardPlaceholder testId="market-top-card-2" />;
  }

  if (isError || !data) {
    return (
      <MarketTopCardError testId="market-top-card-2" titleKey="market.topCards.moodIndex.title" />
    );
  }

  return <MoodIndexCardView data={data} onClick={onClick} />;
}

export function MoodIndexCard() {
  const isMoodIndexAvailable = useMoodIndexAvailability();

  if (!isMoodIndexAvailable) {
    return null;
  }

  return <MoodIndexCardContent />;
}

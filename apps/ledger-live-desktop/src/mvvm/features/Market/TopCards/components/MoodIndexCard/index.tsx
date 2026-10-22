import React from "react";
import { FearAndGreed } from "@features/flow-fear-and-greed";
import { ArcGaugeIndicator } from "LLD/components/ArcGaugeIndicator";
import { useMoodIndexCardViewModel } from "./useMoodIndexCardViewModel";

export function MoodIndexCard() {
  const { moodIndexAvailable } = useMoodIndexCardViewModel();

  if (!moodIndexAvailable) {
    return null;
  }

  return <FearAndGreed appearance="expanded" Gauge={ArcGaugeIndicator} />;
}

import React from "react";
import { CardOnboardingWidgetCardView } from "./CardOnboardingWidgetCardView";
import { useCardOnboardingWidgetCardViewModel } from "./useCardOnboardingWidgetCardViewModel";

type Props = {
  completedCount: number;
  totalCount: number;
  onOpen: () => void;
  onboardingCompleted: boolean;
};

export function CardOnboardingWidgetCard(props: Readonly<Props>) {
  return <CardOnboardingWidgetCardView {...useCardOnboardingWidgetCardViewModel(props)} />;
}

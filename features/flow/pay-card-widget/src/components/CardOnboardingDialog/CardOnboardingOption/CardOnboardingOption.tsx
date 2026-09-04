import React from "react";
import { CardOnboardingOptionView } from "./CardOnboardingOptionView";
import type { CardOnboardingOptionViewProps } from "./useCardOnboardingOptionViewModel";
import { useCardOnboardingOptionViewModel } from "./useCardOnboardingOptionViewModel";

export function CardOnboardingOption(props: CardOnboardingOptionViewProps) {
  return <CardOnboardingOptionView {...useCardOnboardingOptionViewModel(props)} />;
}

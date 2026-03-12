import React from "react";
import { useOnboardingWidgetViewModel } from "./useOnboardingWidgetViewModel";
import { OnboardingWidgetView } from "./OnboardingWidgetView";

export const OnboardingWidget = () => {
  const viewModel = useOnboardingWidgetViewModel();
  return <OnboardingWidgetView {...viewModel} />;
};

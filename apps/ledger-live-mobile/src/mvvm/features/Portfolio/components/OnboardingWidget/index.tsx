import React from "react";
import { useOnboardingWidgetViewModel } from "./useOnboardingWidgetViewModel";
import { OnboardingWidgetView } from "./OnboardingWidgetView";

const OnboardingWidget = () => {
  const viewModel = useOnboardingWidgetViewModel();
  return <OnboardingWidgetView {...viewModel} />;
};

export default OnboardingWidget;

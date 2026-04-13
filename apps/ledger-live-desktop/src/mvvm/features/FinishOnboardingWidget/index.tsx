import React from "react";
import { useWidgetCardViewModel } from "./useWidgetCardViewModel";
import { WidgetCardView } from "./WidgetCardView";

const FinishOnboardingWidget = () => {
  const viewModel = useWidgetCardViewModel();

  return <WidgetCardView {...viewModel} />;
};

export default FinishOnboardingWidget;

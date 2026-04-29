import React from "react";
import FinishOnboardingWidgetView from "./FinishOnboardingWidgetView";
import { useFinishOnboardingWidgetViewModel } from "./useFinishOnboardingWidgetViewModel";

const FinishOnboardingWidget = () => (
  <FinishOnboardingWidgetView {...useFinishOnboardingWidgetViewModel()} />
);

export { useFinishOnboardingWidgetViewModel };
export default FinishOnboardingWidget;

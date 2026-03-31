import React from "react";
import { useAnalyticsConsentDrawerViewModel } from "./useAnalyticsConsentDrawerViewModel";
import { AnalyticsConsentDrawerView } from "./AnalyticsConsentDrawerView";

export function AnalyticsConsentDrawer() {
  const viewModel = useAnalyticsConsentDrawerViewModel();
  return <AnalyticsConsentDrawerView {...viewModel} />;
}

import React from "react";
import { useAnalyticsConsentDrawerViewModel } from "./hooks/useAnalyticsConsentDrawerViewModel";
import { AnalyticsConsentDrawerView } from "./screens/AnalyticsConsentDrawerView";

export function AnalyticsConsentDrawer() {
  const viewModel = useAnalyticsConsentDrawerViewModel();
  return <AnalyticsConsentDrawerView {...viewModel} />;
}

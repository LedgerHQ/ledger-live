import React from "react";
import { AnalyticsConsentModalView } from "./AnalyticsConsentModalView";
import { useAnalyticsConsentModalViewModel } from "./useAnalyticsConsentModalViewModel";

export function AnalyticsConsentModal() {
  const viewModel = useAnalyticsConsentModalViewModel();
  return <AnalyticsConsentModalView {...viewModel} />;
}

export { AnalyticsConsentModalView } from "./AnalyticsConsentModalView";
export { useAnalyticsConsentModalViewModel } from "./useAnalyticsConsentModalViewModel";

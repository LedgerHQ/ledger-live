import React from "react";
import { AnalyticsConsentModalView } from "./screens/AnalyticsConsentModalView";
import { useAnalyticsConsentModalViewModel } from "./hooks/useAnalyticsConsentModalViewModel";

export function AnalyticsConsentModal() {
  const viewModel = useAnalyticsConsentModalViewModel();
  return <AnalyticsConsentModalView {...viewModel} />;
}

export { AnalyticsConsentModalView } from "./screens/AnalyticsConsentModalView";
export {
  ANALYTICS_CONSENT_FLOW,
  ANALYTICS_CONSENT_MODAL_PAGE,
  useAnalyticsConsentModalViewModel,
} from "./hooks/useAnalyticsConsentModalViewModel";

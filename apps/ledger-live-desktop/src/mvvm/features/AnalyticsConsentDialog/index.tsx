import React from "react";
import { AnalyticsConsentDialogView } from "./screens/AnalyticsConsentDialogView";
import { useAnalyticsConsentDialogViewModel } from "./hooks/useAnalyticsConsentDialogViewModel";

export function AnalyticsConsentDialog() {
  const viewModel = useAnalyticsConsentDialogViewModel();
  return <AnalyticsConsentDialogView {...viewModel} />;
}

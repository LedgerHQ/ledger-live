import React from "react";
import { AnalyticsConsentDialogView } from "./screens/AnalyticsConsentDialogView";
import { useAnalyticsConsentDialogViewModel } from "./hooks/useAnalyticsConsentDialogViewModel";

export function AnalyticsConsentDialog() {
  const viewModel = useAnalyticsConsentDialogViewModel();
  return <AnalyticsConsentDialogView {...viewModel} />;
}

export { AnalyticsConsentDialogView } from "./screens/AnalyticsConsentDialogView";
export {
  ANALYTICS_CONSENT_FLOW,
  ANALYTICS_CONSENT_DIALOG_PAGE,
  useAnalyticsConsentDialogViewModel,
} from "./hooks/useAnalyticsConsentDialogViewModel";

import React from "react";
import { AnalyticsOptInScreenV2View } from "./screens/AnalyticsOptInScreenV2View";
import { useAnalyticsOptInScreenV2ViewModel } from "./hooks/useAnalyticsOptInScreenV2ViewModel";
import type { AnalyticsOptInScreenV2HostProps } from "./types";

export function AnalyticsOptInScreenV2(props: AnalyticsOptInScreenV2HostProps) {
  const viewModel = useAnalyticsOptInScreenV2ViewModel(props);
  return <AnalyticsOptInScreenV2View {...viewModel} />;
}

export { AnalyticsOptInScreenV2View } from "./screens/AnalyticsOptInScreenV2View";
export { useAnalyticsOptInScreenV2ViewModel } from "./hooks/useAnalyticsOptInScreenV2ViewModel";
export type { AnalyticsOptInScreenV2HostProps } from "./types";

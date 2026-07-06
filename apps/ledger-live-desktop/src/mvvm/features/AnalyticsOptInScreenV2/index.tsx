import React from "react";
import { AnalyticsOptInScreenView } from "./AnalyticsOptInScreenView";
import { useAnalyticsOptInScreenViewModel } from "./hooks/useAnalyticsOptInScreenViewModel";
import type { AnalyticsOptInScreenHostProps } from "./types";

export function AnalyticsOptInScreenV2(props: AnalyticsOptInScreenHostProps) {
  const viewModel = useAnalyticsOptInScreenViewModel(props);
  return <AnalyticsOptInScreenView {...viewModel} />;
}

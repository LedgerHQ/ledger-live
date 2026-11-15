import React from "react";
import { AnalyticsFilterSelectView } from "./AnalyticsFilterSelectView";
import type { AnalyticsFilterSelectProps } from "./AnalyticsFilterSelect.types";
import { useAnalyticsFilterSelectViewModel } from "./useAnalyticsFilterSelectViewModel";

export function AnalyticsFilterSelect(props: AnalyticsFilterSelectProps) {
  return <AnalyticsFilterSelectView {...props} sheet={useAnalyticsFilterSelectViewModel(props)} />;
}

import React from "react";
import { useAnalyticsFiltersViewModel } from "./useAnalyticsFiltersViewModel";
import { AnalyticsFiltersView } from "./AnalyticsFiltersView";
import type { AnalyticsFiltersProps } from "./AnalyticsFilters.types";

export function AnalyticsFilters(props: AnalyticsFiltersProps) {
  return <AnalyticsFiltersView {...useAnalyticsFiltersViewModel(props)} />;
}

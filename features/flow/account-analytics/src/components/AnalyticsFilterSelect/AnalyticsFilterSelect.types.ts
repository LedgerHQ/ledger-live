import type { AnalyticsFilterViewProps } from "../AnalyticsFilters/AnalyticsFiltersView.types";

export type AnalyticsFilterSelectProps = AnalyticsFilterViewProps &
  Readonly<{ variant: "asset" | "account" }>;

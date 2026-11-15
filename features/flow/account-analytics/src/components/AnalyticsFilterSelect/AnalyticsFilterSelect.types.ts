import type { AnalyticsFilterViewProps } from "../AnalyticsFilters/AnalyticsFiltersView.types";
import type { AnalyticsFilterVariant } from "./analyticsFilterVariants";

export type AnalyticsFilterSelectProps = AnalyticsFilterViewProps &
  Readonly<{ variant: AnalyticsFilterVariant }>;

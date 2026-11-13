import type { AnalyticsFilterOption } from "../AnalyticsFilters/AnalyticsFiltersView.types";

export function matchAnalyticsFilterOption(option: AnalyticsFilterOption, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery === "") return true;
  return [option.label, option.meta?.ticker].some(text =>
    text?.toLowerCase().includes(normalizedQuery),
  );
}

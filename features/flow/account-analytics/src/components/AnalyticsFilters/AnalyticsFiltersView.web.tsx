import React from "react";
import { AnalyticsFilterSelect } from "../AnalyticsFilterSelect/AnalyticsFilterSelect";
import type { AnalyticsFiltersViewProps } from "./AnalyticsFiltersView.types";

export function AnalyticsFiltersView({ asset, account }: AnalyticsFiltersViewProps) {
  return (
    <div className="flex flex-wrap items-center gap-12" data-testid="account-analytics-filters">
      <AnalyticsFilterSelect variant="asset" {...asset} />
      {account && <AnalyticsFilterSelect variant="account" {...account} />}
    </div>
  );
}

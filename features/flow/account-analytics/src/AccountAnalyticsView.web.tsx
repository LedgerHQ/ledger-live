import React from "react";
import { AccountAnalyticsSections } from "./AccountAnalyticsSections";
import type { AccountAnalyticsViewProps } from "./AccountAnalytics.types";

export function AccountAnalyticsView(props: AccountAnalyticsViewProps) {
  return (
    <div className="flex flex-col gap-32" data-testid="account-analytics">
      <AccountAnalyticsSections {...props} />
    </div>
  );
}

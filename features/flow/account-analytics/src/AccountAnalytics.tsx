import React from "react";
import { useAccountAnalyticsScreenViewModel } from "./useAccountAnalyticsScreenViewModel";
import { AccountAnalyticsView } from "./AccountAnalyticsView";
import type { AccountAnalyticsProps } from "./AccountAnalytics.types";

export function AccountAnalytics(props: AccountAnalyticsProps) {
  return <AccountAnalyticsView {...useAccountAnalyticsScreenViewModel(props)} />;
}

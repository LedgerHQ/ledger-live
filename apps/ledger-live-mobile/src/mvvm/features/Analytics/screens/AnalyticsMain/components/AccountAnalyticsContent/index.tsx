import React from "react";
import { AccountAnalytics } from "@features/flow-account-analytics";
import { ScopedChartSection } from "../ScopedChartSection";
import { ScopedPnlSection } from "../ScopedPnlSection";
import {
  useAccountAnalyticsContentViewModel,
  type AccountAnalyticsContentProps,
} from "./useAccountAnalyticsContentViewModel";

export function AccountAnalyticsContent(props: AccountAnalyticsContentProps) {
  const { visitKey, analyticsProps, positions } = useAccountAnalyticsContentViewModel(props);
  return (
    <AccountAnalytics
      key={visitKey}
      {...analyticsProps}
      renderBalance={balanceProps => <ScopedChartSection {...balanceProps} positions={positions} />}
      renderPnl={pnlProps => <ScopedPnlSection {...pnlProps} positions={positions} />}
    />
  );
}

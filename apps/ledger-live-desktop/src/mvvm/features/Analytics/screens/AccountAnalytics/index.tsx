import React from "react";
import { TrackScreen } from "@shared/analytics-react";
import { AccountAnalytics } from "@features/flow-account-analytics";
import PageHeader from "LLD/components/PageHeader";
import { AllocationSection } from "../../components/Allocation/AllocationSection";
import { AnalyticsBalanceRenderer } from "../../components/AnalyticsBalanceRenderer";
import { AnalyticsPnlRenderer } from "../../components/AnalyticsPnlRenderer";
import { useAccountAnalyticsScreenViewModel } from "./useAccountAnalyticsScreenViewModel";

export function AccountAnalyticsScreen() {
  const { title, onBack, counterValue, selectedTimeRange, visitKey, analyticsProps, positions } =
    useAccountAnalyticsScreenViewModel();
  return (
    <div className="flex flex-col gap-32 pb-32">
      <TrackScreen category="Analytics" range={selectedTimeRange} countervalue={counterValue} />
      <PageHeader title={title} onBack={onBack} />
      <AccountAnalytics
        key={visitKey}
        {...analyticsProps}
        renderBalance={props => <AnalyticsBalanceRenderer {...props} positions={positions} />}
        renderPnl={props => <AnalyticsPnlRenderer {...props} positions={positions} />}
      />
      <AllocationSection />
    </div>
  );
}

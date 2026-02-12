import React from "react";
import PageHeader from "LLD/components/PageHeader";
import TrackPage from "~/renderer/analytics/TrackPage";
import PortfolioBalanceSummary from "~/renderer/screens/dashboard/GlobalSummary";
import { colors } from "~/renderer/styles/theme";
import useAnalyticsViewModel from "./useAnalyticsViewModel";
import { AnalyticsViewModel } from "./types";

export default function Analytics() {
  const viewModel = useAnalyticsViewModel();
  return <AnalyticsContent viewModel={viewModel} />;
}

function AnalyticsContent({ viewModel }: { readonly viewModel: AnalyticsViewModel }) {
  const { counterValue, selectedTimeRange, t, navigateToDashboard, shouldDisplayGraphRework } =
    viewModel;
  return (
    <div className="flex flex-col gap-32">
      <TrackPage category="Analytics" range={selectedTimeRange} countervalue={counterValue} />
      <PageHeader title={t("analytics.title")} onBack={navigateToDashboard} />

      <div className="overflow-hidden rounded-md bg-surface" data-testid="analytics-chart">
        <PortfolioBalanceSummary
          counterValue={counterValue}
          chartColor={colors.wallet}
          range={selectedTimeRange}
          isWallet40
          shouldDisplayGraphRework={shouldDisplayGraphRework}
        />
      </div>
    </div>
  );
}

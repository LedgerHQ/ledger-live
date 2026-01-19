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

function AnalyticsContent({ viewModel }: { viewModel: AnalyticsViewModel }) {
  const { counterValue, selectedTimeRange, t, navigateToDashboard } = viewModel;
  return (
    <div className="flex flex-col gap-32">
      <TrackPage category="Analytics" range={selectedTimeRange} countervalue={counterValue} />
      <PageHeader title={t("analytics.title")} onBack={navigateToDashboard} />

      <PortfolioBalanceSummary
        counterValue={counterValue}
        chartColor={colors.wallet}
        range={selectedTimeRange}
      />
    </div>
  );
}

import React from "react";
import PageHeader from "LLD/components/PageHeader";
import TrackPage from "~/renderer/analytics/TrackPage";
import PortfolioBalanceSummary from "~/renderer/screens/dashboard/GlobalSummary";
import { colors } from "~/renderer/styles/theme";
import useAnalyticsViewModel from "./useAnalyticsViewModel";
import type { AnalyticsViewModel } from "./types";
import { AllocationSection } from "./components/Allocation/AllocationSection";
import { useTranslation } from "react-i18next";

export default function Analytics() {
  const viewModel = useAnalyticsViewModel();
  return <AnalyticsView viewModel={viewModel} />;
}

function AnalyticsView({ viewModel }: { readonly viewModel: AnalyticsViewModel }) {
  const {
    counterValue,
    selectedTimeRange,
    navigateToDashboard,
    shouldDisplayGraphRework,
    shouldDisplayAssetSection,
  } = viewModel;

  const { t } = useTranslation();

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

      {shouldDisplayAssetSection && <AllocationSection />}
    </div>
  );
}

import React from "react";
import PageHeader from "LLD/components/PageHeader";
import TrackPage from "~/renderer/analytics/TrackPage";
import PortfolioBalanceSummary from "~/renderer/screens/dashboard/GlobalSummary";
import { colors } from "~/renderer/styles/theme";
import useAnalyticsViewModel from "./useAnalyticsViewModel";
import type { AnalyticsViewModel } from "./types";
import { AllocationSection } from "./components/Allocation/AllocationSection";
import { PnLSection } from "./components/PnL";
import { ChartSection } from "./components/ChartSection";
import { cn } from "LLD/utils/cn";
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
    shouldDisplayAssetSection,
    shouldDisplayPnl,
    balanceInfo,
    portfolio,
    isLoading,
  } = viewModel;

  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-32 pb-32">
      <TrackPage category="Analytics" range={selectedTimeRange} countervalue={counterValue} />
      <PageHeader title={t("analytics.title")} onBack={navigateToDashboard} />

      <div
        className={cn(!shouldDisplayPnl && "rounded-md bg-surface")}
        data-testid="analytics-chart"
      >
        {shouldDisplayPnl ? (
          <ChartSection balanceInfo={balanceInfo} portfolio={portfolio} isLoading={isLoading} />
        ) : (
          <PortfolioBalanceSummary
            counterValue={counterValue}
            chartColor={colors.wallet}
            range={selectedTimeRange}
            isWallet40
            balanceInfo={balanceInfo}
          />
        )}
      </div>

      <PnLSection />

      {shouldDisplayAssetSection && <AllocationSection />}
    </div>
  );
}

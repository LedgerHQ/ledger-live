import React, { memo } from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import BannerSection from "~/renderer/screens/dashboard/components/BannerSection";
import MarketBanner from "LLD/features/MarketBanner";
import PageHeader from "LLD/components/PageHeader";
import { PortfolioViewModelResult } from "./hooks/usePortfolioViewModel";

import OperationsList from "~/renderer/components/OperationsList";
import AssetDistribution from "~/renderer/screens/dashboard/AssetDistribution";
import { Balance } from "./components/Balance";
import QuickActions from "LLD/features/QuickActions";

export const PortfolioView = memo(function PortfolioView({
  totalAccounts,
  totalOperations,
  totalCurrencies,
  hasExchangeBannerCTA,
  shouldDisplayMarketBanner,
  shouldDisplayGraphRework,
  shouldDisplayQuickActionCtas,
  isWallet40Enabled,
  accounts,
  filterOperations,
  t,
}: PortfolioViewModelResult) {
  return (
    <>
      <BannerSection isWallet40Enabled={isWallet40Enabled} />
      <TrackPage
        category="Portfolio"
        totalAccounts={totalAccounts}
        totalOperations={totalOperations}
        totalCurrencies={totalCurrencies}
        hasExchangeBannerCTA={hasExchangeBannerCTA}
      />
      <div id="portfolio-container" data-testid="portfolio-container" className="flex flex-col">
        {/* Main content area */}
        <div className="flex flex-1 flex-col gap-32">
          <div className="flex flex-col gap-24">
            <PageHeader title={t("portfolio.title")} />
            {shouldDisplayGraphRework && <Balance />}
            {shouldDisplayQuickActionCtas && <QuickActions />}
            {shouldDisplayMarketBanner && <MarketBanner />}
          </div>

          <AssetDistribution />
          {totalOperations > 0 && (
            <OperationsList
              accounts={accounts}
              title={t("dashboard.recentActivity")}
              withAccount
              withSubAccounts
              filterOperation={filterOperations}
              t={t}
              isWallet40={isWallet40Enabled}
            />
          )}
        </div>
      </div>
    </>
  );
});

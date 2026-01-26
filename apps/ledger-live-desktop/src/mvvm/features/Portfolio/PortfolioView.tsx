import React, { memo } from "react";
import { cn } from "LLD/utils/cn";
import TrackPage from "~/renderer/analytics/TrackPage";
import BannerSection from "~/renderer/screens/dashboard/components/BannerSection";
import MarketBanner from "LLD/features/MarketBanner";
import PageHeader from "LLD/components/PageHeader";
import SwapWebViewEmbedded from "~/renderer/screens/dashboard/components/SwapWebViewEmbedded";
import { PortfolioViewModelResult } from "./hooks/usePortfolioViewModel";

import OperationsList from "~/renderer/components/OperationsList";
import AssetDistribution from "~/renderer/screens/dashboard/AssetDistribution";
import { Balance } from "./components/Balance";

/**
 * Swap sidebar height calculation:
 * 100vh - (topBarHeight + padding * 2) = 100vh - (58px + 16px * 2) = 100vh - 90px
 */
const SWAP_SIDEBAR_HEIGHT = "h-[100vh]";

export const PortfolioView = memo(function PortfolioView({
  totalAccounts,
  totalOperations,
  totalCurrencies,
  hasExchangeBannerCTA,
  shouldDisplayMarketBanner,
  shouldDisplayGraphRework,
  shouldDisplaySwapWebView,
  isWallet40Enabled,
  accounts,
  filterOperations,
  t,
}: PortfolioViewModelResult) {
  return (
    <>
      <BannerSection />
      <TrackPage
        category="Portfolio"
        totalAccounts={totalAccounts}
        totalOperations={totalOperations}
        totalCurrencies={totalCurrencies}
        hasExchangeBannerCTA={hasExchangeBannerCTA}
      />
      <div id="portfolio-container" data-testid="portfolio-container" className="flex gap-32 py-32">
        {/* Main content area */}
        <div className="flex flex-1 flex-col gap-32">
          <div className="flex flex-col gap-24">
            <PageHeader title={t("portfolio.title")} />
            {shouldDisplayGraphRework && <Balance />}
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
              isWallet40={shouldDisplayGraphRework}
            />
          )}
        </div>

        {/* Swap WebView - sticky sidebar */}
        {shouldDisplaySwapWebView && (
          <div className={cn("sticky top-0 w-[375px] shrink-0", SWAP_SIDEBAR_HEIGHT)}>
            <SwapWebViewEmbedded height="100%" isWallet40={isWallet40Enabled} />
          </div>
        )}
      </div>
    </>
  );
});

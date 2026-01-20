import React, { memo } from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import BannerSection from "~/renderer/screens/dashboard/components/BannerSection";
import MarketBanner from "LLD/features/MarketBanner";
import SwapWebViewEmbedded from "~/renderer/screens/dashboard/components/SwapWebViewEmbedded";
import { PortfolioGrid } from "./components/PortfolioGrid";
import { PortfolioViewModelResult } from "./hooks/usePortfolioViewModel";

import OperationsList from "~/renderer/components/OperationsList";
import AssetDistribution from "~/renderer/screens/dashboard/AssetDistribution";

export const PortfolioView = memo(function PortfolioView({
  totalAccounts,
  totalOperations,
  totalCurrencies,
  hasExchangeBannerCTA,
  shouldDisplayMarketBanner,
  shouldDisplaySwapWebView,
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
      <div
        id="portfolio-container"
        data-testid="portfolio-container"
        className="flex flex-col gap-32"
      >
        <PortfolioGrid>
          <div>{shouldDisplayMarketBanner && <MarketBanner />}</div>
          {shouldDisplaySwapWebView && (
            <div className="ml-10 max-w-[700px] min-w-[375px]">
              <SwapWebViewEmbedded height="550px" />
            </div>
          )}
        </PortfolioGrid>

        <AssetDistribution />
        {totalOperations > 0 && (
          <OperationsList
            accounts={accounts}
            title={t("dashboard.recentActivity")}
            withAccount
            withSubAccounts
            filterOperation={filterOperations}
            t={t}
          />
        )}
      </div>
    </>
  );
});

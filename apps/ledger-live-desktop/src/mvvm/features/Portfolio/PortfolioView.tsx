import React, { memo } from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import MarketBanner from "LLD/features/MarketBanner";
import PageHeader from "LLD/components/PageHeader";
import { PortfolioViewModelResult } from "./hooks/usePortfolioViewModel";

import OperationsList from "~/renderer/components/OperationsList";
import AssetDistribution from "~/renderer/screens/dashboard/AssetDistribution";
import { Balance } from "./components/Balance";
import QuickActions from "LLD/features/QuickActions";
import { AddAccount } from "./components/AddAccount";
import { PerpsEntryPoint } from "./components/PerpsEntryPoint";
import { PORTFOLIO_TRACKING_PAGE_NAME } from "./utils/constants";
import { Divider } from "@ledgerhq/lumen-ui-react";
import BannerSection from "~/renderer/screens/dashboard/components/Banners/BannerSection";
import { PortfolioBannerContent } from "~/renderer/screens/dashboard/components/Banners/PortfolioBannerContent";

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
  isClearCacheBannerVisible,
}: PortfolioViewModelResult) {
  const shouldDisplayAddAccountCta = totalAccounts === 0 && isWallet40Enabled;

  return (
    <>
      <div className={isClearCacheBannerVisible && isWallet40Enabled ? "mb-32" : undefined}>
        <BannerSection topBannerAlerts={true} portfolioBannerContent={false} />
      </div>
      <TrackPage
        category={PORTFOLIO_TRACKING_PAGE_NAME}
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
            {shouldDisplayQuickActionCtas && (
              <QuickActions trackingPageName={PORTFOLIO_TRACKING_PAGE_NAME} />
            )}
            {shouldDisplayQuickActionCtas && <Divider orientation="horizontal" className="mb-8" />}
          </div>
          <PerpsEntryPoint />

          <PortfolioBannerContent />
          {shouldDisplayMarketBanner && <MarketBanner />}
          {shouldDisplayAddAccountCta && <AddAccount />}

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

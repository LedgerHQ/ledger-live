import React, { memo } from "react";
import { TrackScreen } from "@shared/analytics-react";
import MarketBanner from "LLD/features/MarketBanner";
import PageHeader from "LLD/components/PageHeader";
import { PortfolioViewModelResult } from "./hooks/usePortfolioViewModel";

import { Balance } from "./components/Balance";
import QuickActions from "LLD/features/QuickActions";
import { PerpsEntryPoint } from "./components/PerpsEntryPoint";
import { BorrowEntryPoint } from "./components/BorrowEntryPoint";
import { PortfolioServicesEntryPoints } from "./components/PortfolioServicesEntryPoints";
import { PORTFOLIO_TRACKING_PAGE_NAME } from "LLD/utils/constants";
import { Divider } from "@ledgerhq/lumen-ui-react";
import BannerSection from "~/renderer/screens/dashboard/components/Banners/BannerSection";
import { PortfolioBannerContent } from "~/renderer/screens/dashboard/components/Banners/PortfolioBannerContent";
import Assets from "LLD/features/Assets";
import { StocksSection } from "./components/StocksSection";
import { CryptoAddressesBanner } from "LLD/features/CryptoAddresses/components/Banner";
import { BottomCarouselContentCards } from "LLD/features/DynamicContent/components/BottomCarouselContentCards";

export const PortfolioView = memo(function PortfolioView({
  totalAccounts,
  totalOperations,
  totalCurrencies,
  hasExchangeBannerCTA,
  shouldDisplayBorrowSection,
  shouldDisplayPerpsEntryPoint,
  shouldDisplayServicesEntryPoints,
  shouldDisplayBrazePlacement,
  t,
  isClearCacheBannerVisible,
}: PortfolioViewModelResult) {
  return (
    <>
      <div className={isClearCacheBannerVisible ? "mb-32" : undefined}>
        <BannerSection topBannerAlerts={true} portfolioBannerContent={false} />
      </div>
      <TrackScreen
        category={PORTFOLIO_TRACKING_PAGE_NAME}
        totalAccounts={totalAccounts}
        totalOperations={totalOperations}
        totalCurrencies={totalCurrencies}
        hasExchangeBannerCTA={hasExchangeBannerCTA}
      />
      <div id="portfolio-container" data-testid="portfolio-container" className="flex flex-col">
        {/* Main content area */}
        <div className="flex flex-1 flex-col gap-32 pb-32">
          <div className="flex flex-col gap-24">
            <PageHeader title={t("portfolio.title")} />
            <Balance />

            <QuickActions trackingPageName={PORTFOLIO_TRACKING_PAGE_NAME} />

            <Divider orientation="horizontal" className="mb-8" />
          </div>

          <PortfolioBannerContent />

          <MarketBanner />

          {shouldDisplayPerpsEntryPoint && <PerpsEntryPoint />}

          <Assets
            afterCryptosSection={
              shouldDisplayServicesEntryPoints ? <PortfolioServicesEntryPoints /> : null
            }
          />
          <StocksSection />
          {shouldDisplayBorrowSection && <BorrowEntryPoint />}
          <CryptoAddressesBanner />
          {shouldDisplayBrazePlacement && <BottomCarouselContentCards />}
        </div>
      </div>
    </>
  );
});

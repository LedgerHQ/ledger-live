import React, { useMemo, useState } from "react";
import { useFeature, useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import Box from "~/renderer/components/Box";
import { accountsSelector } from "~/renderer/reducers/accounts";
import BalanceSummary from "./GlobalSummary";
import { colors } from "~/renderer/styles/theme";
import {
  counterValueCurrencySelector,
  hasInstalledAppsSelector,
  selectedTimeRangeSelector,
} from "~/renderer/reducers/settings";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import TrackPage from "~/renderer/analytics/TrackPage";
import OperationsList from "~/renderer/components/OperationsList";
import ShowHiddenSmallValueOperationsToggle from "~/renderer/components/ShowHiddenSmallValueOperationsToggle";
import AssetDistribution from "./AssetDistribution";
import { useSelector } from "LLD/hooks/redux";
import uniq from "lodash/uniq";
import EmptyStateInstalledApps from "~/renderer/screens/dashboard/EmptyStateInstalledApps";
import EmptyStateAccounts from "~/renderer/screens/dashboard/EmptyStateAccounts";
import FeaturedButtons from "~/renderer/screens/dashboard/components/FeaturedButtons";
import { Flex, Grid } from "@ledgerhq/react-ui";
import AnalyticsOptInPrompt from "LLD/features/AnalyticsOptInPrompt/screens";
import { useDisplayOnPortfolioAnalytics } from "LLD/features/AnalyticsOptInPrompt/hooks/useDisplayOnPortfolio";
import SwapWebViewEmbedded from "./components/SwapWebViewEmbedded";
import { MarketBanner as MarketBannerFeature } from "@features/market-banner";
import Portfolio from "LLD/features/Portfolio";
import { PerpsEntryPoint } from "LLD/features/Portfolio/components/PerpsEntryPoint";
import BannerSection from "./components/Banners/BannerSection";
import { useSmallValueOperationsFilter } from "~/renderer/hooks/useSmallValueOperationsFilter";

// This forces only one visible top banner at a time
export const TopBannerContainer = styled.div`
  z-index: 19;

  & > *:not(:first-child) {
    display: none;
  }
`;
export default function DashboardPage() {
  const { t } = useTranslation();
  const accounts = useSelector(accountsSelector);

  const counterValue = useSelector(counterValueCurrencySelector);
  const selectedTimeRange = useSelector(selectedTimeRangeSelector);
  const hasInstalledApps = useSelector(hasInstalledAppsSelector);
  const totalAccounts = accounts.length;
  const portfolioExchangeBanner = useFeature("portfolioExchangeBanner");
  const totalCurrencies = useMemo(() => uniq(accounts.map(a => a.currency.id)).length, [accounts]);
  const totalOperations = useMemo(
    () => accounts.reduce((sum, a) => sum + a.operations.length, 0),
    [accounts],
  );
  const [showHiddenSmallValueOperations, setShowHiddenSmallValueOperations] = useState(false);
  const { filterOperations, isSmallValueFilterEnabled } = useSmallValueOperationsFilter(
    showHiddenSmallValueOperations,
  );

  const { isFeatureFlagsAnalyticsPrefDisplayed, analyticsOptInPromptProps } =
    useDisplayOnPortfolioAnalytics();

  const ptxSwapLiveAppOnPortfolio = useFeature("ptxSwapLiveAppOnPortfolio");
  const { shouldDisplayMarketBanner, isEnabled: isWallet40Enabled } =
    useWalletFeaturesConfig("desktop");

  return (
    <>
      {isWallet40Enabled ? (
        <Portfolio />
      ) : (
        <>
          <BannerSection />
          {!ptxSwapLiveAppOnPortfolio?.enabled && <FeaturedButtons />}
          <TrackPage
            category="Portfolio"
            totalAccounts={totalAccounts}
            totalOperations={totalOperations}
            totalCurrencies={totalCurrencies}
            hasExchangeBannerCTA={!!portfolioExchangeBanner?.enabled}
          />
          <Flex flexDirection="column" rowGap={32}>
            {shouldDisplayMarketBanner && __DEV__ && <MarketBannerFeature />}
            <Box flow={7} id="portfolio-container" data-testid="portfolio-container">
              {!hasInstalledApps ? (
                <EmptyStateInstalledApps />
              ) : totalAccounts > 0 ? (
                <>
                  {ptxSwapLiveAppOnPortfolio?.enabled ? (
                    <PortfolioGrid marginTop={4}>
                      <Box>
                        <FeaturedButtons hideSwapButton />
                        <BalanceSummary
                          counterValue={counterValue}
                          chartColor={colors.wallet}
                          range={selectedTimeRange}
                        />
                      </Box>

                      <Box ml={2} minWidth={375} maxWidth={700}>
                        <SwapWebViewEmbedded height="550px" />
                      </Box>
                    </PortfolioGrid>
                  ) : (
                    <BalanceSummary
                      counterValue={counterValue}
                      chartColor={colors.wallet}
                      range={selectedTimeRange}
                    />
                  )}
                  <PerpsEntryPoint />
                  <AssetDistribution />
                  {totalOperations > 0 && (
                    <>
                      {isSmallValueFilterEnabled && (
                        <Box mb={3} alignItems="flex-end">
                          <ShowHiddenSmallValueOperationsToggle
                            isChecked={showHiddenSmallValueOperations}
                            onChange={setShowHiddenSmallValueOperations}
                          />
                        </Box>
                      )}
                      <OperationsList
                        accounts={accounts}
                        title={t("dashboard.recentActivity")}
                        withAccount
                        withSubAccounts
                        filterOperation={filterOperations}
                        t={t}
                      />
                    </>
                  )}
                </>
              ) : (
                <EmptyStateAccounts />
              )}
            </Box>
          </Flex>
        </>
      )}

      {isFeatureFlagsAnalyticsPrefDisplayed && (
        <AnalyticsOptInPrompt {...analyticsOptInPromptProps} />
      )}
    </>
  );
}

const PortfolioGrid = styled(Grid).attrs(() => ({
  columnGap: 2,
  columns: 2,
}))`
  grid-template-columns: 2fr 1fr;
`;

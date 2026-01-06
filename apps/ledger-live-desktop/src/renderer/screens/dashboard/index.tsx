import React, { useCallback, useMemo } from "react";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { isAddressPoisoningOperation } from "@ledgerhq/live-common/operation";
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
import AssetDistribution from "./AssetDistribution";
import { useFilterTokenOperationsZeroAmount } from "~/renderer/actions/settings";
import { useSelector } from "LLD/hooks/redux";
import uniq from "lodash/uniq";
import EmptyStateInstalledApps from "~/renderer/screens/dashboard/EmptyStateInstalledApps";
import EmptyStateAccounts from "~/renderer/screens/dashboard/EmptyStateAccounts";
import FeaturedButtons from "~/renderer/screens/dashboard/components/FeaturedButtons";
import { AccountLike, Operation } from "@ledgerhq/types-live";
import MarketPerformanceWidget from "LLD/features/MarketPerformanceWidget";
import { useMarketPerformanceFeatureFlag } from "~/renderer/actions/marketperformance";
import { Grid } from "@ledgerhq/react-ui";
import AnalyticsOptInPrompt from "LLD/features/AnalyticsOptInPrompt/screens";
import { useDisplayOnPortfolioAnalytics } from "LLD/features/AnalyticsOptInPrompt/hooks/useDisplayOnPortfolio";
import SwapWebViewEmbedded from "./components/SwapWebViewEmbedded";
import BannerSection from "./components/BannerSection";

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
  const [shouldFilterTokenOpsZeroAmount] = useFilterTokenOperationsZeroAmount();

  const filterOperations = useCallback(
    (operation: Operation, account: AccountLike) => {
      // Remove operations linked to address poisoning
      const removeZeroAmountTokenOp =
        shouldFilterTokenOpsZeroAmount && isAddressPoisoningOperation(operation, account);

      return !removeZeroAmountTokenOp;
    },
    [shouldFilterTokenOpsZeroAmount],
  );

  const { enabled: marketPerformanceEnabled, variant: marketPerformanceVariant } =
    useMarketPerformanceFeatureFlag();

  const { isFeatureFlagsAnalyticsPrefDisplayed, analyticsOptInPromptProps } =
    useDisplayOnPortfolioAnalytics();

  const ptxSwapLiveAppOnPortfolio = useFeature("ptxSwapLiveAppOnPortfolio");

  return (
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
            ) : marketPerformanceEnabled ? (
              <PortfolioGrid>
                <BalanceSummary
                  counterValue={counterValue}
                  chartColor={colors.wallet}
                  range={selectedTimeRange}
                />

                <Box ml={2} minWidth={275}>
                  <MarketPerformanceWidget variant={marketPerformanceVariant} />
                </Box>
              </PortfolioGrid>
            ) : (
              <BalanceSummary
                counterValue={counterValue}
                chartColor={colors.wallet}
                range={selectedTimeRange}
              />
            )}

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
          </>
        ) : (
          <EmptyStateAccounts />
        )}
      </Box>
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

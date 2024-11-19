import React, { useCallback, useMemo } from "react";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { isAddressPoisoningOperation } from "@ledgerhq/live-common/operation";
import Box from "~/renderer/components/Box";
import { accountsSelector, currenciesSelector } from "~/renderer/reducers/accounts";
import BalanceSummary from "./GlobalSummary";
import { colors } from "~/renderer/styles/theme";
import {
  counterValueCurrencySelector,
  hasInstalledAppsSelector,
  selectedTimeRangeSelector,
  hiddenNftCollectionsSelector,
} from "~/renderer/reducers/settings";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import TrackPage from "~/renderer/analytics/TrackPage";
import OperationsList from "~/renderer/components/OperationsList";
import AssetDistribution from "./AssetDistribution";
import ClearCacheBanner from "~/renderer/components/ClearCacheBanner";
import RecoverBanner from "~/renderer/components/RecoverBanner/RecoverBanner";
import { usePostOnboardingEntryPointVisibleOnWallet } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { useFilterTokenOperationsZeroAmount } from "~/renderer/actions/settings";
import { useSelector } from "react-redux";
import uniq from "lodash/uniq";
import EmptyStateInstalledApps from "~/renderer/screens/dashboard/EmptyStateInstalledApps";
import EmptyStateAccounts from "~/renderer/screens/dashboard/EmptyStateAccounts";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import PostOnboardingHubBanner from "~/renderer/components/PostOnboardingHub/PostOnboardingHubBanner";
import FeaturedButtons from "~/renderer/screens/dashboard/FeaturedButtons";
import { ABTestingVariants, AccountLike, Operation } from "@ledgerhq/types-live";
import ActionContentCards from "~/renderer/screens/dashboard/ActionContentCards";
import MarketPerformanceWidget from "~/renderer/screens/dashboard/MarketPerformanceWidget";
import { useMarketPerformanceFeatureFlag } from "~/renderer/actions/marketperformance";
import { Grid } from "@ledgerhq/react-ui";
import AnalyticsOptInPrompt from "LLD/features/AnalyticsOptInPrompt/screens";
import { useDisplayOnPortfolioAnalytics } from "LLD/features/AnalyticsOptInPrompt/hooks/useDisplayOnPortfolio";
import Carousel from "~/renderer/components/Carousel";
import useActionCards from "~/renderer/hooks/useActionCards";
import { useAutoRedirectToPostOnboarding } from "~/renderer/hooks/useAutoRedirectToPostOnboarding";

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
  const currencies = useSelector(currenciesSelector);

  const counterValue = useSelector(counterValueCurrencySelector);
  const selectedTimeRange = useSelector(selectedTimeRangeSelector);
  const hasInstalledApps = useSelector(hasInstalledAppsSelector);
  const totalAccounts = accounts.length;
  const portfolioExchangeBanner = useFeature("portfolioExchangeBanner");
  const lldActionCarousel = useFeature("lldActionCarousel");
  const totalCurrencies = useMemo(() => uniq(accounts.map(a => a.currency.id)).length, [accounts]);
  const totalOperations = useMemo(
    () => accounts.reduce((sum, a) => sum + a.operations.length, 0),
    [accounts],
  );
  const isPostOnboardingBannerVisible = usePostOnboardingEntryPointVisibleOnWallet();

  useAutoRedirectToPostOnboarding();

  const [shouldFilterTokenOpsZeroAmount] = useFilterTokenOperationsZeroAmount();
  const hiddenNftCollections = useSelector(hiddenNftCollectionsSelector);
  const filterOperations = useCallback(
    (operation: Operation, account: AccountLike) => {
      // Remove operations linked to address poisoning
      const removeZeroAmountTokenOp =
        shouldFilterTokenOpsZeroAmount && isAddressPoisoningOperation(operation, account);
      // Remove operations coming from an NFT collection considered spam
      const opFromBlacklistedNftCollection = operation?.nftOperations?.find(op =>
        hiddenNftCollections.includes(`${account.id}|${op?.contract}`),
      );
      return !opFromBlacklistedNftCollection && !removeZeroAmountTokenOp;
    },
    [hiddenNftCollections, shouldFilterTokenOpsZeroAmount],
  );

  const { enabled: marketPerformanceEnabled, variant: marketPerformanceVariant } =
    useMarketPerformanceFeatureFlag();
  const { actionCards } = useActionCards();
  const isActionCardsCampainRunning = actionCards.length > 0;

  const { isFeatureFlagsAnalyticsPrefDisplayed, analyticsOptInPromptProps } =
    useDisplayOnPortfolioAnalytics();

  return (
    <>
      <TopBannerContainer>
        <ClearCacheBanner />
        <CurrencyDownStatusAlert currencies={currencies} hideStatusIncidents />
      </TopBannerContainer>
      <Box>
        {isPostOnboardingBannerVisible ? (
          <PostOnboardingHubBanner />
        ) : (
          <RecoverBanner>
            {isActionCardsCampainRunning && lldActionCarousel?.enabled ? (
              <ActionContentCards variant={ABTestingVariants.variantA} />
            ) : (
              <Carousel />
            )}
          </RecoverBanner>
        )}
      </Box>
      <FeaturedButtons />
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
            {marketPerformanceEnabled ? (
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
                t={t}
                accounts={accounts}
                title={t("dashboard.recentActivity")}
                withAccount
                withSubAccounts
                filterOperation={filterOperations}
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

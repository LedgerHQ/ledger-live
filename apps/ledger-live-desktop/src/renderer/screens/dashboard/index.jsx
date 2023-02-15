// @flow
import React, { useCallback, useMemo } from "react";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
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
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import TrackPage, { setTrackingSource } from "~/renderer/analytics/TrackPage";
import OperationsList from "~/renderer/components/OperationsList";
import Carousel from "~/renderer/components/Carousel";
import AssetDistribution from "~/renderer/components/AssetDistribution";
import MigrationBanner from "~/renderer/modals/MigrateAccounts/Banner";
import ClearCacheBanner from "~/renderer/components/ClearCacheBanner";
import { usePostOnboardingEntryPointVisibleOnWallet } from "@ledgerhq/live-common/postOnboarding/hooks/index";

import { saveSettings } from "~/renderer/actions/settings";
import { useDispatch, useSelector } from "react-redux";
import uniq from "lodash/uniq";
import { useHistory } from "react-router-dom";
import EmptyStateInstalledApps from "~/renderer/screens/dashboard/EmptyStateInstalledApps";
import EmptyStateAccounts from "~/renderer/screens/dashboard/EmptyStateAccounts";
import { useRefreshAccountsOrderingEffect } from "~/renderer/actions/general";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import PostOnboardingHubBanner from "~/renderer/components/PostOnboardingHub/PostOnboardingHubBanner";
import FeaturedButtons from "~/renderer/screens/dashboard/FeaturedButtons";

// This forces only one visible top banner at a time
export const TopBannerContainer: ThemedComponent<{}> = styled.div`
  z-index: 19;

  & > *:not(:first-child) {
    display: none;
  }
`;

export default function DashboardPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const accounts = useSelector(accountsSelector);
  const currencies = useSelector(currenciesSelector);
  const history = useHistory();
  const counterValue = useSelector(counterValueCurrencySelector);
  const selectedTimeRange = useSelector(selectedTimeRangeSelector);
  const hasInstalledApps = useSelector(hasInstalledAppsSelector);
  const totalAccounts = accounts.length;
  const portfolioExchangeBanner = useFeature("portfolioExchangeBanner");
  const totalCurrencies = useMemo(() => uniq(accounts.map(a => a.currency.id)).length, [accounts]);
  const totalOperations = useMemo(() => accounts.reduce((sum, a) => sum + a.operations.length, 0), [
    accounts,
  ]);
  const isPostOnboardingBannerVisible = usePostOnboardingEntryPointVisibleOnWallet();

  const onAccountClick = useCallback(
    account => {
      setTrackingSource("dashboard page");
      history.push({ pathname: `/account/${account.id}` });
    },
    [history],
  );
  const handleChangeSelectedTime = useCallback(
    item => dispatch(saveSettings({ selectedTimeRange: item.key })),
    [dispatch],
  );
  const showCarousel = hasInstalledApps && totalAccounts > 0;

  useRefreshAccountsOrderingEffect({ onMount: true });

  const hiddenNftCollections = useSelector(hiddenNftCollectionsSelector);
  const filterOperations = useCallback(
    (operation, account) => {
      return !operation?.nftOperations?.find(op =>
        hiddenNftCollections.includes(`${account.id}|${op?.contract}`),
      );
    },
    [hiddenNftCollections],
  );

  return (
    <>
      <TopBannerContainer>
        <MigrationBanner />
        <ClearCacheBanner />
        <CurrencyDownStatusAlert currencies={currencies} hideStatusIncidents />
      </TopBannerContainer>
      {showCarousel ? <Carousel /> : null}
      {isPostOnboardingBannerVisible && <PostOnboardingHubBanner />}
      <FeaturedButtons />
      <TrackPage
        category="Portfolio"
        totalAccounts={totalAccounts}
        totalOperations={totalOperations}
        totalCurrencies={totalCurrencies}
        hasExchangeBannerCTA={!!portfolioExchangeBanner?.enabled}
      />
      <Box flow={7} id="portfolio-container">
        {!hasInstalledApps ? (
          <EmptyStateInstalledApps />
        ) : totalAccounts > 0 ? (
          <>
            <BalanceSummary
              counterValue={counterValue}
              chartId="dashboard-chart"
              chartColor={colors.wallet}
              range={selectedTimeRange}
              handleChangeSelectedTime={handleChangeSelectedTime}
              selectedTimeRange={selectedTimeRange}
            />
            <AssetDistribution />
            {totalOperations > 0 && (
              <OperationsList
                onAccountClick={onAccountClick}
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
    </>
  );
}

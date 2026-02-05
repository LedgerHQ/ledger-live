import React, { useCallback, useEffect, useMemo, useState } from "react";
import { shallowEqual } from "react-redux";
import { useSelector } from "~/context/hooks";
import { Platform } from "react-native";
import { useTranslation } from "~/context/Locale";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { Box, Flex } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";

import WalletTabSafeAreaView from "~/components/WalletTab/WalletTabSafeAreaView";
import { useRefreshAccountsOrdering } from "~/actions/general";
import Carousel from "~/components/Carousel";
import { ScreenName } from "~/const";
import FirmwareUpdateBanner from "LLM/features/FirmwareUpdate/components/UpdateBanner";
import CheckLanguageAvailability from "~/components/CheckLanguageAvailability";
import CheckTermOfUseUpdate from "~/components/CheckTermOfUseUpdate";
import RecoverBanner from "~/components/RecoverBanner";
import PortfolioEmptyState from "./PortfolioEmptyState";
import SectionTitle from "../WalletCentricSections/SectionTitle";
import SectionContainer from "../WalletCentricSections/SectionContainer";
import AllocationsSection from "../WalletCentricSections/Allocations";
import { track } from "~/analytics";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { WalletTabNavigatorStackParamList } from "~/components/RootNavigator/types/WalletTabNavigator";
import CollapsibleHeaderFlatList from "~/components/WalletTab/CollapsibleHeaderFlatList";
import globalSyncRefreshControl from "~/components/globalSyncRefreshControl";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
import PortfolioOperationsHistorySection from "./PortfolioOperationsHistorySection";
import PortfolioGraphCard from "./PortfolioGraphCard";
import {
  flattenAccountsSelector,
  hasNonTokenAccountsSelector,
  hasTokenAccountsNotBlacklistedSelector,
  hasTokenAccountsNotBlackListedWithPositiveBalanceSelector,
} from "~/reducers/accounts";
import PortfolioAssets from "./PortfolioAssets";
import { UpdateStep } from "../FirmwareUpdate";
import ContentCardsLocation from "~/dynamicContent/ContentCardsLocation";
import { ContentCardLocation } from "~/dynamicContent/types";
import usePortfolioAnalyticsOptInPrompt from "~/hooks/analyticsOptInPrompt/usePorfolioAnalyticsOptInPrompt";
import AddAccountDrawer from "LLM/features/Accounts/screens/AddAccount";
import { LNSUpsellBanner, useLNSUpsellBannerState } from "LLM/features/LNSUpsell";
import { useAutoRedirectToPostOnboarding } from "~/hooks/useAutoRedirectToPostOnboarding";
export { default as PortfolioTabIcon } from "./TabIcon";
import Animated, { useSharedValue } from "react-native-reanimated";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import AnimatedContainer from "./AnimatedContainer";
import storage from "LLM/storage";
import type { Feature_LlmMmkvMigration } from "@ledgerhq/types-live";
import { useUpdateStoreWithHidDevice } from "~/hooks/useUpdateStoreWithHidDevice";
import { DdRum } from "@datadog/mobile-react-native";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { PORTFOLIO_VIEW_ID, TOP_CHAINS } from "~/utils/constants";
import { buildFeatureFlagTags } from "~/utils/datadogUtils";
import { renderItem } from "LLM/utils/renderItem";

type NavigationProps = BaseComposite<
  StackNavigatorProps<WalletTabNavigatorStackParamList, ScreenName.Portfolio>
>;

const RefreshableCollapsibleHeaderFlatList = globalSyncRefreshControl(CollapsibleHeaderFlatList, {
  progressViewOffset: Platform.OS === "android" ? 64 : 0,
});

function PortfolioScreen({ navigation }: NavigationProps) {
  const hideEmptyTokenAccount = useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");
  const { t } = useTranslation();
  const [isAddModalOpened, setAddModalOpened] = useState(false);
  const { colors } = useTheme();
  const { isAWalletCardDisplayed } = useDynamicContent();
  const accountListFF = useFeature("llmAccountListUI");
  const isAccountListUIEnabled = accountListFF?.enabled;
  const llmDatadog = useFeature("llmDatadog");
  const allAccounts = useSelector(flattenAccountsSelector, shallowEqual);
  useUpdateStoreWithHidDevice();
  const isFocused = useIsFocused();

  const mmkvMigrationFF = useFeature("llmMmkvMigration");

  useEffect(() => {
    async function handleMigration() {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      await storage.handleMigration(mmkvMigrationFF as Feature_LlmMmkvMigration);
    }
    handleMigration();
  }, [mmkvMigrationFF]);

  const onBackFromUpdate = useCallback(
    (_updateState: UpdateStep) => {
      navigation.goBack();
    },
    [navigation],
  );

  useAutoRedirectToPostOnboarding();

  usePortfolioAnalyticsOptInPrompt();

  const openAddModal = useCallback(() => {
    track("button_clicked", {
      button: "Add Account",
    });
    setAddModalOpened(true);
  }, [setAddModalOpened]);

  const closeAddModal = useCallback(() => setAddModalOpened(false), [setAddModalOpened]);
  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  useFocusEffect(refreshAccountsOrdering);

  useEffect(() => {
    if (!llmDatadog?.enabled) return;
    const topChains = allAccounts.reduce<string[]>((acc, account) => {
      const currencyName = getAccountCurrency(account).name.toLowerCase();
      if (TOP_CHAINS.includes(currencyName)) acc.push(getAccountCurrency(account).name);
      return acc;
    }, []);
    DdRum.startView(
      PORTFOLIO_VIEW_ID,
      ScreenName.Portfolio,
      { topChains, featureFlags: buildFeatureFlagTags() },
      Date.now(),
    );
    DdRum.addViewLoadingTime(true);
  }, [allAccounts, llmDatadog?.enabled]);

  const hasTokenAccounts = useSelector(hasTokenAccountsNotBlacklistedSelector);
  const hasNonTokenAccounts = useSelector(hasNonTokenAccountsSelector);
  const hasTokenAccountsWithPositiveBalance = useSelector(
    hasTokenAccountsNotBlackListedWithPositiveBalanceSelector,
  );

  const showAssets =
    hasNonTokenAccounts || // always show accounts even if they are empty
    hasTokenAccountsWithPositiveBalance || // always show token accounts if they are not empty
    (!hideEmptyTokenAccount && hasTokenAccounts); // conditionally show empty token accounts

  const animatedHeight = useSharedValue(0);

  const handleHeightChange = useCallback(
    (newHeight: number) => {
      if (newHeight === 0 || !isFocused) return;
      animatedHeight.value = newHeight;
    },
    [animatedHeight, isFocused],
  );

  const isLNSUpsellBannerShown = useLNSUpsellBannerState("wallet").isShown;

  const onPressAllocations = useCallback(() => {
    navigation.navigate(ScreenName.AnalyticsAllocation);
  }, [navigation]);

  const data = useMemo(
    () => [
      <WalletTabSafeAreaView key="portfolioHeaderElements" edges={["left", "right"]}>
        <Flex px={6} key="FirmwareUpdateBanner">
          <FirmwareUpdateBanner onBackFromUpdate={onBackFromUpdate} />
        </Flex>
        <PortfolioGraphCard
          showAssets={showAssets}
          key="PortfolioGraphCard"
          screenName={ScreenName.Portfolio}
        />
        {isLNSUpsellBannerShown && <LNSUpsellBanner location="wallet" mx={6} mt={7} />}
        {!isLNSUpsellBannerShown && showAssets ? (
          <ContentCardsLocation
            key="contentCardsLocationPortfolio"
            locationId={ContentCardLocation.TopWallet}
            mt="20px"
          />
        ) : null}
      </WalletTabSafeAreaView>,
      showAssets ? (
        isAccountListUIEnabled ? (
          <AnimatedContainer onHeightChange={handleHeightChange}>
            <Box background={colors.background.main} px={6} key="PortfolioAssets">
              <RecoverBanner />
              <PortfolioAssets
                hideEmptyTokenAccount={hideEmptyTokenAccount}
                openAddModal={openAddModal}
              />
            </Box>
          </AnimatedContainer>
        ) : (
          <Box background={colors.background.main} px={6} key="PortfolioAssets">
            <RecoverBanner />
            <PortfolioAssets
              hideEmptyTokenAccount={hideEmptyTokenAccount}
              openAddModal={openAddModal}
            />
          </Box>
        )
      ) : null,
      ...(showAssets && isAWalletCardDisplayed
        ? [
            <Box background={colors.background.main} key="CarouselTitle">
              <SectionContainer px={0} minHeight={240} isFirst>
                <SectionTitle
                  title={t("portfolio.carousel.title")}
                  containerProps={{ mb: 7, mx: 6 }}
                />
                <Carousel />
              </SectionContainer>
            </Box>,
          ]
        : []),
      ...(showAssets
        ? [
            <SectionContainer px={6} isFirst={!isAWalletCardDisplayed} key="AllocationsSection">
              <SectionTitle
                title={t("analytics.allocation.title")}
                testID="portfolio-allocation-section"
              />
              <Flex minHeight={94} mt={6}>
                <AllocationsSection
                  screenName={ScreenName.Portfolio}
                  onPress={onPressAllocations}
                />
              </Flex>
            </SectionContainer>,
            <SectionContainer px={6} key="PortfolioOperationsHistorySection">
              <SectionTitle
                title={t("analytics.operations.title")}
                testID="portfolio-transaction-history-section"
              />
              <PortfolioOperationsHistorySection />
            </SectionContainer>,
          ]
        : [
            // If the user has no accounts we display an empty state
            <Flex flexDirection="column" mt={30} mx={6} key="PortfolioEmptyState">
              <RecoverBanner />
              <PortfolioEmptyState openAddAccountModal={openAddModal} />
            </Flex>,
          ]),
    ],
    [
      onBackFromUpdate,
      showAssets,
      onPressAllocations,
      isLNSUpsellBannerShown,
      isAccountListUIEnabled,
      handleHeightChange,
      colors.background.main,
      hideEmptyTokenAccount,
      openAddModal,
      isAWalletCardDisplayed,
      t,
    ],
  );

  return (
    <>
      <CheckLanguageAvailability />
      <CheckTermOfUseUpdate />
      <Animated.View style={{ flex: 1 }}>
        <RefreshableCollapsibleHeaderFlatList
          data={data}
          renderItem={renderItem<React.JSX.Element>}
          keyExtractor={(_: unknown, index: number) => String(index)}
          showsVerticalScrollIndicator={false}
          testID={showAssets ? "PortfolioAccountsList" : "PortfolioEmptyList"}
        />
        <AddAccountDrawer
          isOpened={isAddModalOpened}
          onClose={closeAddModal}
          doesNotHaveAccount={!showAssets}
        />
      </Animated.View>
    </>
  );
}

export default PortfolioScreen;

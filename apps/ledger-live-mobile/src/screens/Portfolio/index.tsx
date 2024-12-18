import React, { useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { ListRenderItemInfo, Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { Box, Flex } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { ReactNavigationPerformanceView } from "@shopify/react-native-performance-navigation";
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
import { useAutoRedirectToPostOnboarding } from "~/hooks/useAutoRedirectToPostOnboarding";

export { default as PortfolioTabIcon } from "./TabIcon";

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

  const hasTokenAccounts = useSelector(hasTokenAccountsNotBlacklistedSelector);
  const hasNonTokenAccounts = useSelector(hasNonTokenAccountsSelector);
  const hasTokenAccountsWithPositiveBalance = useSelector(
    hasTokenAccountsNotBlackListedWithPositiveBalanceSelector,
  );

  const showAssets =
    hasNonTokenAccounts || // always show accounts even if they are empty
    hasTokenAccountsWithPositiveBalance || // always show token accounts if they are not empty
    (!hideEmptyTokenAccount && hasTokenAccounts); // conditionally show empty token accounts

  const data = useMemo(
    () => [
      <WalletTabSafeAreaView key="portfolioHeaderElements" edges={["left", "right"]}>
        <Flex px={6} key="FirmwareUpdateBanner">
          <FirmwareUpdateBanner onBackFromUpdate={onBackFromUpdate} />
        </Flex>
        <PortfolioGraphCard showAssets={showAssets} key="PortfolioGraphCard" />
        {showAssets ? (
          <ContentCardsLocation
            key="contentCardsLocationPortfolio"
            locationId={ContentCardLocation.TopWallet}
            mt={7}
          />
        ) : null}
      </WalletTabSafeAreaView>,
      showAssets ? (
        <Box background={colors.background.main} px={6} key="PortfolioAssets">
          <RecoverBanner />
          <PortfolioAssets
            hideEmptyTokenAccount={hideEmptyTokenAccount}
            openAddModal={openAddModal}
          />
        </Box>
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
              <SectionTitle title={t("analytics.allocation.title")} />
              <Flex minHeight={94}>
                <AllocationsSection />
              </Flex>
            </SectionContainer>,
            <SectionContainer px={6} key="PortfolioOperationsHistorySection">
              <SectionTitle title={t("analytics.operations.title")} />
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
      colors.background.main,
      hideEmptyTokenAccount,
      openAddModal,
      isAWalletCardDisplayed,
      t,
    ],
  );

  return (
    <ReactNavigationPerformanceView screenName={ScreenName.Portfolio} interactive>
      <CheckLanguageAvailability />
      <CheckTermOfUseUpdate />
      <RefreshableCollapsibleHeaderFlatList
        data={data}
        renderItem={({ item }: ListRenderItemInfo<unknown>) => {
          return item as JSX.Element;
        }}
        keyExtractor={(_: unknown, index: number) => String(index)}
        showsVerticalScrollIndicator={false}
        testID={showAssets ? "PortfolioAccountsList" : "PortfolioEmptyList"}
      />
      <AddAccountDrawer
        isOpened={isAddModalOpened}
        onClose={closeAddModal}
        doesNotHaveAccount={!showAssets}
      />
    </ReactNavigationPerformanceView>
  );
}

export default PortfolioScreen;

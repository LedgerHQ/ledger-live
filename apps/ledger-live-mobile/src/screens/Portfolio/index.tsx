import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ListRenderItemInfo, Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { Box, Flex } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { ReactNavigationPerformanceView } from "@shopify/react-native-performance-navigation";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useRefreshAccountsOrdering } from "../../actions/general";
import {
  discreetModeSelector,
  hasBeenUpsoldProtectSelector,
  lastConnectedDeviceSelector,
} from "../../reducers/settings";
import { setHasBeenUpsoldProtect } from "../../actions/settings";

import Carousel from "../../components/Carousel";
import TrackScreen from "../../analytics/TrackScreen";
import { ScreenName } from "../../const";
import FirmwareUpdateBanner from "../../components/FirmwareUpdateBanner";
import CheckLanguageAvailability from "../../components/CheckLanguageAvailability";
import CheckTermOfUseUpdate from "../../components/CheckTermOfUseUpdate";
import { useProviders } from "../Swap/Form/index";
import PortfolioEmptyState from "./PortfolioEmptyState";
import SectionTitle from "../WalletCentricSections/SectionTitle";
import SectionContainer from "../WalletCentricSections/SectionContainer";
import AllocationsSection from "../WalletCentricSections/Allocations";
import { track } from "../../analytics";
import {
  BaseComposite,
  BaseNavigation,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import { WalletTabNavigatorStackParamList } from "../../components/RootNavigator/types/WalletTabNavigator";
import AddAccountsModal from "../AddAccounts/AddAccountsModal";
import CollapsibleHeaderFlatList from "../../components/WalletTab/CollapsibleHeaderFlatList";
import globalSyncRefreshControl from "../../components/globalSyncRefreshControl";
import useDynamicContent from "../../dynamicContent/dynamicContent";
import PortfolioOperationsHistorySection from "./PortfolioOperationsHistorySection";
import PortfolioGraphCard from "./PortfolioGraphCard";
import {
  hasNonTokenAccountsSelector,
  hasTokenAccountsNotBlacklistedSelector,
  hasTokenAccountsNotBlackListedWithPositiveBalanceSelector,
} from "../../reducers/accounts";
import PortfolioAssets from "./PortfolioAssets";
import { internetReachable } from "../../logic/internetReachable";
import { useLearnMoreURI } from "../../hooks/recoverFeatureFlag";

export { default as PortfolioTabIcon } from "./TabIcon";

type NavigationProps = BaseComposite<
  StackNavigatorProps<WalletTabNavigatorStackParamList, ScreenName.Portfolio>
>;

const RefreshableCollapsibleHeaderFlatList = globalSyncRefreshControl(
  CollapsibleHeaderFlatList,
  { progressViewOffset: 64 },
);

function PortfolioScreen({ navigation }: NavigationProps) {
  const hideEmptyTokenAccount = useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");
  const { t } = useTranslation();

  const discreetMode = useSelector(discreetModeSelector);
  const hasBeenUpsoldProtect = useSelector(hasBeenUpsoldProtectSelector);
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const [isAddModalOpened, setAddModalOpened] = useState(false);
  const { colors } = useTheme();
  const { isAWalletCardDisplayed } = useDynamicContent();
  const protectFeature = useFeature("protectServicesMobile");
  const recoverUpsellURL = useLearnMoreURI();
  const dispatch = useDispatch();

  useEffect(() => {
    const openProtectUpsell = async () => {
      const internetConnected = await internetReachable();
      if (internetConnected && recoverUpsellURL && protectFeature?.enabled) {
        Linking.openURL(recoverUpsellURL);
      }
    };
    if (!hasBeenUpsoldProtect && lastConnectedDevice?.modelId === "nanoX") {
      openProtectUpsell();
      dispatch(setHasBeenUpsoldProtect(true));
    }
  }, [
    hasBeenUpsoldProtect,
    lastConnectedDevice,
    recoverUpsellURL,
    dispatch,
    protectFeature?.enabled,
  ]);

  const openAddModal = useCallback(() => {
    track("button_clicked", {
      button: "Add Account",
    });
    setAddModalOpened(true);
  }, [setAddModalOpened]);
  useProviders();

  const closeAddModal = useCallback(
    () => setAddModalOpened(false),
    [setAddModalOpened],
  );
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
      <Flex px={6} py={4}>
        <FirmwareUpdateBanner />
      </Flex>,
      <PortfolioGraphCard showAssets={showAssets} />,
      showAssets ? (
        <Box background={colors.background.main} px={6} mt={6}>
          <PortfolioAssets
            hideEmptyTokenAccount={hideEmptyTokenAccount}
            openAddModal={openAddModal}
          />
        </Box>
      ) : (
        <TrackScreen
          category="Wallet"
          accountsLength={0}
          discreet={discreetMode}
        />
      ),
      ...(showAssets && isAWalletCardDisplayed
        ? [
            <Box background={colors.background.main}>
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
            <SectionContainer px={6} isFirst={!isAWalletCardDisplayed}>
              <SectionTitle title={t("analytics.allocation.title")} />
              <Flex minHeight={94}>
                <AllocationsSection />
              </Flex>
            </SectionContainer>,
            <SectionContainer px={6} mb={8}>
              <SectionTitle title={t("analytics.operations.title")} />
              <PortfolioOperationsHistorySection />
            </SectionContainer>,
          ]
        : [
            // If the user has no accounts we display an empty state
            <Box mx={6} mt={12}>
              <PortfolioEmptyState openAddAccountModal={openAddModal} />
            </Box>,
          ]),
    ],
    [
      showAssets,
      colors.background.main,
      hideEmptyTokenAccount,
      openAddModal,
      discreetMode,
      isAWalletCardDisplayed,
      t,
    ],
  );

  return (
    <ReactNavigationPerformanceView
      screenName={ScreenName.Portfolio}
      interactive
    >
      <CheckLanguageAvailability />
      <CheckTermOfUseUpdate />
      <RefreshableCollapsibleHeaderFlatList
        data={data}
        renderItem={({ item }: ListRenderItemInfo<unknown>) => {
          return item as JSX.Element;
        }}
        keyExtractor={(_: unknown, index: number) => String(index)}
        showsVerticalScrollIndicator={false}
        testID={showAssets ? "PortfolioAccountsList" : "PortfolioEmptyAccount"}
      />
      <AddAccountsModal
        navigation={navigation as unknown as BaseNavigation}
        isOpened={isAddModalOpened}
        onClose={closeAddModal}
      />
    </ReactNavigationPerformanceView>
  );
}

export default PortfolioScreen;

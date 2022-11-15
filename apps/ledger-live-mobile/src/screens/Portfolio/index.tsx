import React, { useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { LayoutChangeEvent } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { isAccountEmpty } from "@ledgerhq/live-common/account/index";

import { Box, Flex, Button, Icons } from "@ledgerhq/native-ui";

import { Currency } from "@ledgerhq/types-cryptoassets";
import { useTheme } from "styled-components/native";
import { usePostOnboardingEntryPointVisibleOnWallet } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import {
  useDistribution,
  useRefreshAccountsOrdering,
} from "../../actions/general";
import { accountsSelector } from "../../reducers/accounts";
import {
  discreetModeSelector,
  counterValueCurrencySelector,
  carouselVisibilitySelector,
} from "../../reducers/settings";

import GraphCardContainer from "./GraphCardContainer";
import Carousel from "../../components/Carousel";
import TrackScreen from "../../analytics/TrackScreen";
import MigrateAccountsBanner from "../MigrateAccounts/Banner";
import { NavigatorName, ScreenName } from "../../const";
import FirmwareUpdateBanner from "../../components/FirmwareUpdateBanner";
import Assets from "./Assets";
import CheckLanguageAvailability from "../../components/CheckLanguageAvailability";
import CheckTermOfUseUpdate from "../../components/CheckTermOfUseUpdate";
import { useProviders } from "../Swap/Form/index";
import PortfolioEmptyState from "./PortfolioEmptyState";
import SectionTitle from "../WalletCentricSections/SectionTitle";
import SectionContainer from "../WalletCentricSections/SectionContainer";
import AllocationsSection from "../WalletCentricSections/Allocations";
import OperationsHistorySection from "../WalletCentricSections/OperationsHistory";
import { track } from "../../analytics";
import PostOnboardingEntryPointCard from "../../components/PostOnboarding/PostOnboardingEntryPointCard";
import {
  BaseComposite,
  BaseNavigation,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import { usePortfolio } from "../../hooks/portfolio";
import { WalletTabNavigatorStackParamList } from "../../components/RootNavigator/types/WalletTabNavigator";
import CollapsibleHeaderScrollView from "../../components/WalletTab/CollapsibleHeaderScrollView";
import AddAccountsModal from "../AddAccounts/AddAccountsModal";

export { default as PortfolioTabIcon } from "./TabIcon";

type NavigationProps = BaseComposite<
  StackNavigatorProps<WalletTabNavigatorStackParamList, ScreenName.Portfolio>
>;

const maxAssetsToDisplay = 5;

// const wait = timeout => {
//   return new Promise(resolve => setTimeout(resolve, timeout));
// };

function PortfolioScreen({ navigation }: NavigationProps) {
  const hideEmptyTokenAccount = useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");

  const { t } = useTranslation();
  const carouselVisibility = useSelector(carouselVisibilitySelector);
  const showCarousel = useMemo(
    () => Object.values(carouselVisibility).some(Boolean),
    [carouselVisibility],
  );

  // const [refreshing, setRefreshing] = React.useState(false);
  // const isFocused = useIsFocused();

  // const onRefresh = React.useCallback(() => {
  //   setRefreshing(true);
  //   wait(5000).then(() => setRefreshing(false));
  // }, []);

  const distribution = useDistribution({
    showEmptyAccounts: true,
    hideEmptyTokenAccount,
  });
  const accounts = useSelector(accountsSelector);

  const counterValueCurrency: Currency = useSelector(
    counterValueCurrencySelector,
  );
  const portfolio = usePortfolio();
  const discreetMode = useSelector(discreetModeSelector);
  const [isAddModalOpened, setAddModalOpened] = useState(false);
  const { colors } = useTheme();
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

  const [graphCardEndPosition, setGraphCardEndPosition] = useState(0);
  const currentPositionY = useSharedValue(0);

  const onPortfolioCardLayout = useCallback((event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    setGraphCardEndPosition(y + height / 10);
  }, []);

  const goToAssets = useCallback(() => {
    navigation.navigate(NavigatorName.Accounts, {
      screen: ScreenName.Assets,
    });
  }, [navigation]);

  const areAccountsEmpty = useMemo(
    () =>
      distribution.list &&
      distribution.list.every(currencyDistribution =>
        currencyDistribution.accounts.every(isAccountEmpty),
      ),
    [distribution],
  );
  const [showAssets, assetsToDisplay] = useMemo(
    () => [
      distribution.isAvailable && distribution.list.length > 0,
      distribution.list.slice(0, maxAssetsToDisplay),
    ],
    [distribution],
  );

  const postOnboardingVisible = usePostOnboardingEntryPointVisibleOnWallet();

  return (
    <>
      <CheckLanguageAvailability />
      <CheckTermOfUseUpdate />
      <TrackScreen
        category="Wallet"
        accountsLength={distribution.list && distribution.list.length}
        discreet={discreetMode}
      />
      <CollapsibleHeaderScrollView
        showsVerticalScrollIndicator={false}
        testID={
          distribution.list && distribution.list.length
            ? "PortfolioAccountsList"
            : "PortfolioEmptyAccount"
        }
        // refreshControl={
        //   <RefreshControl
        //     refreshing={refreshing && isFocused}
        //     onRefresh={onRefresh}
        //   />
        // }
      >
        <FirmwareUpdateBanner />
        {postOnboardingVisible && (
          <Box m={6}>
            <PostOnboardingEntryPointCard />
          </Box>
        )}
        <Box mt={3} onLayout={onPortfolioCardLayout}>
          <GraphCardContainer
            counterValueCurrency={counterValueCurrency}
            portfolio={portfolio}
            areAccountsEmpty={areAccountsEmpty}
            showGraphCard={showAssets}
            currentPositionY={currentPositionY}
            graphCardEndPosition={graphCardEndPosition}
          />
        </Box>
        {showAssets ? (
          <Box background={colors.background.main} px={6} mt={6}>
            <Assets assets={assetsToDisplay} />
            {distribution.list.length < maxAssetsToDisplay ? (
              <Button
                type="shade"
                size="large"
                outline
                mt={6}
                iconPosition="left"
                Icon={Icons.PlusMedium}
                onPress={openAddModal}
              >
                {t("account.emptyState.addAccountCta")}
              </Button>
            ) : (
              <Button
                type="shade"
                size="large"
                outline
                mt={6}
                onPress={goToAssets}
              >
                {t("portfolio.seelAllAssets")}
              </Button>
            )}
          </Box>
        ) : null}
        {showAssets && showCarousel ? (
          <Box background={colors.background.main}>
            <SectionContainer px={0} minHeight={240}>
              <SectionTitle
                title={t("portfolio.recommended.title")}
                containerProps={{ mb: 7, mx: 6 }}
              />
              <Carousel cardsVisibility={carouselVisibility} />
            </SectionContainer>
          </Box>
        ) : null}
        {showAssets ? (
          <>
            <SectionContainer px={6}>
              <SectionTitle title={t("analytics.allocation.title")} />
              <Flex minHeight={94}>
                <AllocationsSection />
              </Flex>
            </SectionContainer>
            <SectionContainer px={6} mb={8} isLast>
              <SectionTitle title={t("analytics.operations.title")} />
              <OperationsHistorySection accounts={accounts} />
            </SectionContainer>
          </>
        ) : (
          // If the user has no accounts we display an empty state
          <Box mx={6} mt={12}>
            <PortfolioEmptyState openAddAccountModal={openAddModal} />
          </Box>
        )}
      </CollapsibleHeaderScrollView>
      <MigrateAccountsBanner />
      <AddAccountsModal
        navigation={navigation as unknown as BaseNavigation}
        isOpened={isAddModalOpened}
        onClose={closeAddModal}
      />
    </>
  );
}

export default PortfolioScreen;

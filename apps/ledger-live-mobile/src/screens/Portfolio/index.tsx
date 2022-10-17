import React, { useCallback, useMemo, useState, memo } from "react";
import { useSelector } from "react-redux";
import { FlatList, LayoutChangeEvent } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { createNativeWrapper } from "react-native-gesture-handler";
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
import { usePortfolio } from "../../actions/portfolio";
import globalSyncRefreshControl from "../../components/globalSyncRefreshControl";
import BackgroundGradient from "../../components/BackgroundGradient";

import GraphCardContainer from "./GraphCardContainer";
import Carousel from "../../components/Carousel";
import Header from "./Header";
import TrackScreen from "../../analytics/TrackScreen";
import MigrateAccountsBanner from "../MigrateAccounts/Banner";
import { NavigatorName, ScreenName } from "../../const";
import FirmwareUpdateBanner from "../../components/FirmwareUpdateBanner";
import Assets from "./Assets";
import AddAccountsModal from "../AddAccounts/AddAccountsModal";
import CheckLanguageAvailability from "../../components/CheckLanguageAvailability";
import CheckTermOfUseUpdate from "../../components/CheckTermOfUseUpdate";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../components/TabBar/TabBarSafeAreaView";
import { useProviders } from "../Swap/Form/index";
import PortfolioEmptyState from "./PortfolioEmptyState";
import SectionTitle from "../WalletCentricSections/SectionTitle";
import SectionContainer from "../WalletCentricSections/SectionContainer";
import AllocationsSection from "../WalletCentricSections/Allocations";
import OperationsHistorySection from "../WalletCentricSections/OperationsHistory";
import { track } from "../../analytics";
import PostOnboardingEntryPointCard from "../../components/PostOnboarding/PostOnboardingEntryPointCard";

export { default as PortfolioTabIcon } from "./TabIcon";

const AnimatedFlatListWithRefreshControl = createNativeWrapper(
  Animated.createAnimatedComponent(globalSyncRefreshControl(FlatList)),
  {
    disallowInterruption: true,
    shouldCancelWhenOutside: false,
  },
);

type Props = {
  navigation: any;
};

const maxAssetsToDisplay = 5;

function PortfolioScreen({ navigation }: Props) {
  const hideEmptyTokenAccount = useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");

  const { t } = useTranslation();
  const carouselVisibility = useSelector(carouselVisibilitySelector);
  const showCarousel = useMemo(
    () => Object.values(carouselVisibility).some(Boolean),
    [carouselVisibility],
  );

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
  const handleScroll = useAnimatedScrollHandler(event => {
    currentPositionY.value = event.contentOffset.y;
  });

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

  const data = useMemo(
    () => [
      <FirmwareUpdateBanner />,
      postOnboardingVisible && (
        <Box m={6}>
          <PostOnboardingEntryPointCard />
        </Box>
      ),
      <Box mt={3} onLayout={onPortfolioCardLayout}>
        <GraphCardContainer
          counterValueCurrency={counterValueCurrency}
          portfolio={portfolio}
          areAccountsEmpty={areAccountsEmpty}
          showGraphCard={showAssets}
          currentPositionY={currentPositionY}
          graphCardEndPosition={graphCardEndPosition}
        />
      </Box>,
      ...(showAssets
        ? [
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
            </Box>,
          ]
        : []),
      ...(showAssets && showCarousel
        ? [
            <Box background={colors.background.main}>
              <SectionContainer px={0} minHeight={240}>
                <SectionTitle
                  title={t("portfolio.recommended.title")}
                  containerProps={{ mb: 7, mx: 6 }}
                />
                <Carousel cardsVisibility={carouselVisibility} />
              </SectionContainer>
            </Box>,
          ]
        : []),
      ...(showAssets
        ? [
            <SectionContainer px={6}>
              <SectionTitle title={t("analytics.allocation.title")} />
              <Flex minHeight={94}>
                <AllocationsSection />
              </Flex>
            </SectionContainer>,
            <SectionContainer px={6} mb={8} isLast>
              <SectionTitle title={t("analytics.operations.title")} />
              <OperationsHistorySection accounts={accounts} />
            </SectionContainer>,
          ]
        : [
            // If the user has no accounts we display an empty state
            <Flex flex={1} mt={12}>
              <PortfolioEmptyState openAddAccountModal={openAddModal} />
            </Flex>,
          ]),
    ],
    [
      onPortfolioCardLayout,
      counterValueCurrency,
      portfolio,
      areAccountsEmpty,
      showAssets,
      currentPositionY,
      graphCardEndPosition,
      colors.background.main,
      t,
      assetsToDisplay,
      distribution.list.length,
      openAddModal,
      showCarousel,
      carouselVisibility,
      accounts,
      goToAssets,
      postOnboardingVisible,
    ],
  );

  return (
    <>
      <TabBarSafeAreaView>
        <CheckLanguageAvailability />
        <CheckTermOfUseUpdate />
        <TrackScreen
          category="Wallet"
          accountsLength={distribution.list && distribution.list.length}
          discreet={discreetMode}
        />
        <BackgroundGradient
          currentPositionY={currentPositionY}
          graphCardEndPosition={graphCardEndPosition}
        />
        <AnimatedFlatListWithRefreshControl
          data={data}
          style={{
            flex: 1,
            paddingTop: 48,
          }}
          contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_HEIGHT }}
          renderItem={({ item }: { item: React.ReactNode }) => item}
          keyExtractor={(_: any, index: number) => String(index)}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          testID={
            distribution.list && distribution.list.length
              ? "PortfolioAccountsList"
              : "PortfolioEmptyAccount"
          }
        />
        <MigrateAccountsBanner />
        <Header
          counterValueCurrency={counterValueCurrency}
          portfolio={portfolio}
          currentPositionY={currentPositionY}
          graphCardEndPosition={graphCardEndPosition}
          hidePortfolio={areAccountsEmpty}
        />
      </TabBarSafeAreaView>

      <AddAccountsModal
        navigation={navigation}
        isOpened={isAddModalOpened}
        onClose={closeAddModal}
      />
    </>
  );
}

export default memo<Props>(PortfolioScreen);

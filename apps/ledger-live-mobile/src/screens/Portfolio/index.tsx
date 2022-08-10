/* eslint-disable import/named */
import React, { useCallback, useMemo, useState, memo } from "react";
import { useSelector } from "react-redux";
import { FlatList } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { createNativeWrapper } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { isAccountEmpty } from "@ledgerhq/live-common/account/index";

import { Box, Flex, Link as TextLink } from "@ledgerhq/native-ui";

import styled, { useTheme } from "styled-components/native";
import { PlusMedium } from "@ledgerhq/native-ui/assets/icons";
import { useRefreshAccountsOrdering } from "../../actions/general";
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
import { NavigatorName } from "../../const";
import FabActions from "../../components/FabActions";
import FirmwareUpdateBanner from "../../components/FirmwareUpdateBanner";
import Assets from "./Assets";
import AddAccountsModal from "../AddAccounts/AddAccountsModal";
import { useProviders } from "../Swap/SwapEntry";
import CheckLanguageAvailability from "../../components/CheckLanguageAvailability";
import CheckTermOfUseUpdate from "../../components/CheckTermOfUseUpdate";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../components/TabBar/TabBarSafeAreaView";
import PortfolioEmptyState from "./PortfolioEmptyState";
import SectionTitle from "../WalletCentricSections/SectionTitle";
import SectionContainer from "../WalletCentricSections/SectionContainer";
import AllocationsSection from "../WalletCentricSections/Allocations";
import OperationsHistorySection from "../WalletCentricSections/OperationsHistory";

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

export const Gradient = styled(BackgroundGradient)``;

const maxAssetsToDisplay = 5;

function PortfolioScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const carouselVisibility = useSelector(carouselVisibilitySelector);
  const showCarousel = useMemo(
    () => Object.values(carouselVisibility).some(Boolean),
    [carouselVisibility],
  );
  const accounts = useSelector(accountsSelector);
  const counterValueCurrency: Currency = useSelector(
    counterValueCurrencySelector,
  );
  const portfolio = usePortfolio();
  const discreetMode = useSelector(discreetModeSelector);
  const [isAddModalOpened, setAddModalOpened] = useState(false);
  const { colors } = useTheme();
  const openAddModal = useCallback(() => setAddModalOpened(true), [
    setAddModalOpened,
  ]);
  useProviders();

  const closeAddModal = useCallback(() => setAddModalOpened(false), [
    setAddModalOpened,
  ]);
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

  const areAccountsEmpty = useMemo(() => accounts.every(isAccountEmpty), [
    accounts,
  ]);
  const [showAssets, assetsToDisplay] = useMemo(
    () => [accounts.length > 0, accounts.slice(0, maxAssetsToDisplay)],
    [accounts],
  );

  const data = useMemo(
    () => [
      <Box onLayout={onPortfolioCardLayout}>
        <GraphCardContainer
          counterValueCurrency={counterValueCurrency}
          portfolio={portfolio}
          areAccountsEmpty={areAccountsEmpty}
          showGraphCard={accounts.length > 0}
          currentPositionY={currentPositionY}
          graphCardEndPosition={graphCardEndPosition}
        />
      </Box>,
      ...(accounts.length > 0
        ? [
            <Box pt={6} background={colors.background.main}>
              <FabActions areAccountsEmpty={areAccountsEmpty} />
            </Box>,
          ]
        : []),
      ...(showAssets
        ? [
            <Box background={colors.background.main}>
              <SectionContainer>
                <SectionTitle
                  title={t("distribution.title")}
                  navigation={navigation}
                  navigatorName={NavigatorName.PortfolioAccounts}
                  containerProps={{ mb: "9px" }}
                />
                <Assets
                  balanceHistory={portfolio.balanceHistory}
                  assets={assetsToDisplay}
                />
                {accounts.length < maxAssetsToDisplay && (
                  <>
                    <Flex
                      mt={6}
                      p={4}
                      border={`1px dashed ${colors.neutral.c40}`}
                      borderRadius={4}
                    >
                      <TextLink
                        onPress={openAddModal}
                        Icon={PlusMedium}
                        iconPosition={"left"}
                        type={"color"}
                      >
                        {t("distribution.moreAssets")}
                      </TextLink>
                    </Flex>
                  </>
                )}
              </SectionContainer>
            </Box>,
          ]
        : []),
      ...(showAssets && showCarousel
        ? [
            <Box background={colors.background.main}>
              <SectionContainer px={0} minHeight={175}>
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
              <AllocationsSection />
            </SectionContainer>,
            <SectionContainer px={6} mb={8} isLast>
              <SectionTitle title={t("analytics.operations.title")} />
              <OperationsHistorySection accounts={assetsToDisplay} />
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
      accounts.length,
      currentPositionY,
      graphCardEndPosition,
      colors.background.main,
      colors.neutral.c40,
      showAssets,
      t,
      navigation,
      assetsToDisplay,
      openAddModal,
      showCarousel,
      carouselVisibility,
    ],
  );

  return (
    <>
      <TabBarSafeAreaView>
        <Flex px={6} py={4}>
          <FirmwareUpdateBanner />
        </Flex>
        <CheckLanguageAvailability />
        <CheckTermOfUseUpdate />
        <TrackScreen
          category="Portfolio"
          accountsLength={accounts.length}
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
            position: "relative",
            paddingTop: 48,
          }}
          contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_HEIGHT }}
          renderItem={({ item }: { item: React.ReactNode }) => item}
          keyExtractor={(_: any, index: number) => String(index)}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          testID={
            accounts.length ? "PortfolioAccountsList" : "PortfolioEmptyAccount"
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

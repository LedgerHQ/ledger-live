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

import { Box, Flex, Button } from "@ledgerhq/native-ui";

import styled, { useTheme } from "styled-components/native";
import { isCurrencySupported } from "@ledgerhq/live-common/lib/currencies";
import { listTokens } from "@ledgerhq/live-common/lib/currencies";
import { listSupportedCurrencies } from "@ledgerhq/live-common/lib/currencies";
import { useCurrenciesByMarketcap } from "@ledgerhq/live-common/lib/currencies";
import { useRefreshAccountsOrdering } from "../../../actions/general";
import {
  discreetModeSelector,
  counterValueCurrencySelector,
  hasOrderedNanoSelector,
} from "../../../reducers/settings";
import { usePortfolio } from "../../../actions/portfolio";
import globalSyncRefreshControl from "../../../components/globalSyncRefreshControl";
import BackgroundGradient from "../../../components/BackgroundGradient";

import GraphCardContainer from "../GraphCardContainer";
import Header from "../Header";
import TrackScreen from "../../../analytics/TrackScreen";
import MigrateAccountsBanner from "../../MigrateAccounts/Banner";
import { NavigatorName, ScreenName } from "../../../const";
import FabActions from "../../../components/FabActions";
import FirmwareUpdateBanner from "../../../components/FirmwareUpdateBanner";
import Assets from "../Assets";
import { useProviders } from "../../Swap/SwapEntry";
import CheckLanguageAvailability from "../../../components/CheckLanguageAvailability";
import CheckTermOfUseUpdate from "../../../components/CheckTermOfUseUpdate";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../../components/TabBar/TabBarSafeAreaView";
import SetupDeviceBanner from "../../../components/SetupDeviceBanner";
import BuyDeviceBanner, {
  IMAGE_PROPS_BIG_NANO,
} from "../../../components/BuyDeviceBanner";
import { useCurrentRouteName } from "../../../helpers/routeHooks";

export { default as PortfolioTabIcon } from "../TabIcon";

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

function ReadOnlyPortfolio({ navigation }: Props) {
  const { t } = useTranslation();
  const counterValueCurrency: Currency = useSelector(
    counterValueCurrencySelector,
  );
  const portfolio = usePortfolio();
  const discreetMode = useSelector(discreetModeSelector);
  const { colors } = useTheme();
  const hasOrderedNano = useSelector(hasOrderedNanoSelector);

  useProviders();

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
    navigation.navigate(NavigatorName.PortfolioAccounts, {
      screen: ScreenName.Assets,
    });
  }, [navigation]);

  const listSupportedTokens = useCallback(
    () => listTokens().filter(t => isCurrencySupported(t.parentCurrency)),
    [],
  );
  const cryptoCurrencies = useMemo(
    () => listSupportedCurrencies().concat(listSupportedTokens()),
    [listSupportedTokens],
  );
  const sortedCryptoCurrencies = useCurrenciesByMarketcap(cryptoCurrencies);
  const topCryptoCurrencies = useMemo(
    () => sortedCryptoCurrencies.slice(0, maxAssetsToDisplay),
    [sortedCryptoCurrencies],
  );
  const assetsToDisplay = useMemo(
    () =>
      topCryptoCurrencies.slice(0, maxAssetsToDisplay).map(currency => ({
        amount: 0,
        accounts: [],
        currency,
      })),
    [topCryptoCurrencies],
  );
  const currentRoute = useCurrentRouteName();

  const data = useMemo(
    () => [
      ...(hasOrderedNano
        ? [
            <Box mx={6} mb={5} mt={6}>
              <SetupDeviceBanner screen="Wallet" />
            </Box>,
          ]
        : []),
      <Box onLayout={onPortfolioCardLayout}>
        <GraphCardContainer
          counterValueCurrency={counterValueCurrency}
          portfolio={portfolio}
          showGraphCard
          areAccountsEmpty={false}
          currentPositionY={currentPositionY}
          graphCardEndPosition={graphCardEndPosition}
        />
      </Box>,
      <Box pt={6} background={colors.background.main}>
        <FabActions areAccountsEmpty={true} />
      </Box>,
      <Box background={colors.background.main} px={6} mt={6}>
        <Assets assets={assetsToDisplay} />
        <Button type="shade" size="large" outline mt={6} onPress={goToAssets}>
          {t("portfolio.seelAllAssets")}
        </Button>
      </Box>,
      ...(!hasOrderedNano
        ? [
            <BuyDeviceBanner
              style={{
                marginHorizontal: 16,
                marginTop: 40,
                paddingTop: 13.5,
                paddingBottom: 13.5,
              }}
              buttonLabel={t("buyDevice.bannerButtonTitle")}
              buttonSize="small"
              event="button_clicked"
              eventProperties={{
                button: "Discover the Nano",
                screen: currentRoute,
              }}
              screen="Wallet"
              {...IMAGE_PROPS_BIG_NANO}
            />,
          ]
        : []),
    ],
    [
      hasOrderedNano,
      onPortfolioCardLayout,
      counterValueCurrency,
      portfolio,
      currentPositionY,
      graphCardEndPosition,
      colors.background.main,
      assetsToDisplay,
      goToAssets,
      t,
      currentRoute,
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
          category="ReadOnlyPortfolio"
          accountsLength={0}
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
            marginBottom: 64,
          }}
          contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_HEIGHT }}
          renderItem={({ item }: { item: React.ReactNode }) => item}
          keyExtractor={(_: any, index: number) => String(index)}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
        />
        <MigrateAccountsBanner />
        <Header
          counterValueCurrency={counterValueCurrency}
          portfolio={portfolio}
          currentPositionY={currentPositionY}
          graphCardEndPosition={graphCardEndPosition}
          hidePortfolio={false}
        />
      </TabBarSafeAreaView>
    </>
  );
}

export default memo<Props>(ReadOnlyPortfolio);

import React, { useCallback, useMemo, useState, memo, useContext } from "react";
import { useSelector } from "react-redux";
import { FlatList, LayoutChangeEvent } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { createNativeWrapper } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";

import { Box, Button } from "@ledgerhq/native-ui";

import styled, { useTheme } from "styled-components/native";
import {
  isCurrencySupported,
  listTokens,
  listSupportedCurrencies,
  useCurrenciesByMarketcap,
} from "@ledgerhq/live-common/currencies/index";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { useRefreshAccountsOrdering } from "../../../actions/general";
import {
  counterValueCurrencySelector,
  hasOrderedNanoSelector,
} from "../../../reducers/settings";
import { usePortfolio } from "../../../actions/portfolio";
import globalSyncRefreshControl from "../../../components/globalSyncRefreshControl";
import BackgroundGradient from "../../../components/BackgroundGradient";

import GraphCardContainer from "../GraphCardContainer";
import Header from "../Header";
import TrackScreen from "../../../analytics/TrackScreen";
import { NavigatorName, ScreenName } from "../../../const";
import { useProviders } from "../../Swap/Form/index";
import MigrateAccountsBanner from "../../MigrateAccounts/Banner";
import CheckLanguageAvailability from "../../../components/CheckLanguageAvailability";
import CheckTermOfUseUpdate from "../../../components/CheckTermOfUseUpdate";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../../components/TabBar/TabBarSafeAreaView";
import SetupDeviceBanner from "../../../components/SetupDeviceBanner";
import BuyDeviceBanner, {
  IMAGE_PROPS_BIG_NANO,
} from "../../../components/BuyDeviceBanner";
// eslint-disable-next-line import/no-cycle
import { AnalyticsContext } from "../../../components/RootNavigator";
import Assets from "../Assets";

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
    navigation.navigate(NavigatorName.Accounts, {
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

  const data = useMemo(
    () => [
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
      ...(hasOrderedNano
        ? [
            <Box mx={6} mt={7}>
              <SetupDeviceBanner screen="Wallet" />
            </Box>,
          ]
        : []),
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
    ],
  );

  const { source, setSource, setScreen } = useContext(AnalyticsContext);

  useFocusEffect(
    useCallback(() => {
      setScreen("Wallet");

      return () => {
        setSource("Wallet");
      };
    }, [setSource, setScreen]),
  );

  return (
    <>
      <TabBarSafeAreaView>
        <CheckLanguageAvailability />
        <CheckTermOfUseUpdate />
        <TrackScreen category="Wallet" source={source} />
        <BackgroundGradient
          currentPositionY={currentPositionY}
          graphCardEndPosition={graphCardEndPosition}
          color={colors.neutral.c30}
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

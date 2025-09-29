import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { LayoutChangeEvent } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useSelector } from "react-redux";

import { Box, Button, Flex } from "@ledgerhq/native-ui";

import { useCurrenciesByMarketcap } from "@ledgerhq/live-common/currencies/hooks";
import {
  isCurrencySupported,
  listSupportedCurrencies,
  listTokens,
} from "@ledgerhq/live-common/currencies/index";
import { Currency } from "@ledgerhq/types-cryptoassets";
import FirmwareUpdateBanner from "LLM/features/FirmwareUpdate/components/UpdateBanner";
import BuyDeviceBanner, {
  IMAGE_PROPS_BUY_DEVICE_FLEX,
} from "LLM/features/Reborn/components/BuyDeviceBanner";
import SetupDeviceBanner from "LLM/features/Reborn/components/SetupDeviceBanner";
import { useTheme } from "styled-components/native";
import { useRefreshAccountsOrdering } from "~/actions/general";
import { AnalyticsContext } from "~/analytics/AnalyticsContext";
import TrackScreen from "~/analytics/TrackScreen";
import CheckLanguageAvailability from "~/components/CheckLanguageAvailability";
import CheckTermOfUseUpdate from "~/components/CheckTermOfUseUpdate";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { WalletTabNavigatorStackParamList } from "~/components/RootNavigator/types/WalletTabNavigator";
import { TAB_BAR_SAFE_HEIGHT } from "~/components/TabBar/TabBarSafeAreaView";
import CollapsibleHeaderFlatList from "~/components/WalletTab/CollapsibleHeaderFlatList";
import { NavigatorName, ScreenName } from "~/const";
import usePortfolioAnalyticsOptInPrompt from "~/hooks/analyticsOptInPrompt/usePorfolioAnalyticsOptInPrompt";
import { usePortfolioAllAccounts } from "~/hooks/portfolio";
import { counterValueCurrencySelector, hasOrderedNanoSelector } from "~/reducers/settings";
import { UpdateStep } from "../../FirmwareUpdate";
import Assets from "../Assets";
import GraphCardContainer from "../GraphCardContainer";

const maxAssetsToDisplay = 5;

type NavigationProps = BaseComposite<
  StackNavigatorProps<WalletTabNavigatorStackParamList, ScreenName.Portfolio>
>;

function ReadOnlyPortfolio({ navigation }: NavigationProps) {
  const { t } = useTranslation();
  const counterValueCurrency: Currency = useSelector(counterValueCurrencySelector);
  const portfolio = usePortfolioAllAccounts();
  const { colors } = useTheme();
  const hasOrderedNano = useSelector(hasOrderedNanoSelector);

  usePortfolioAnalyticsOptInPrompt();

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

  const cryptoCurrencies = useMemo(
    () => [
      ...listSupportedCurrencies(),
      ...listTokens().filter(t => isCurrencySupported(t.parentCurrency)),
    ],
    [],
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
      <Box onLayout={onPortfolioCardLayout} key="GraphCardContainer">
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
            <Box mt={7} key="SetupDeviceBanner">
              <SetupDeviceBanner screen="Wallet" />
            </Box>,
          ]
        : []),
      <Box background={colors.background.main} px={6} mt={6} key="Assets">
        <Assets assets={assetsToDisplay} />
        <Button type="shade" size="large" outline mt={6} onPress={goToAssets}>
          {t("portfolio.seeAllAssets")}
        </Button>
      </Box>,
      ...(!hasOrderedNano
        ? [
            <Flex key="BuyDeviceBanner" mt={6} bg="transparent">
              <BuyDeviceBanner
                {...IMAGE_PROPS_BUY_DEVICE_FLEX}
                image="buyFlex"
                buttonLabel={t("buyDevice.bannerButtonTitle")}
                buttonSize="small"
                event="button_clicked"
                eventProperties={{
                  button: "Discover the Nano",
                }}
                screen="Wallet"
              />
            </Flex>,
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

  const onBackFromUpdate = useCallback(
    (_updateState: UpdateStep) => {
      navigation.goBack();
    },
    [navigation],
  );

  const focusEffect = useCallback(() => {
    setScreen && setScreen("Wallet");
    return () => setSource("Wallet");
  }, [setSource, setScreen]);

  useFocusEffect(focusEffect);

  return (
    <>
      <Flex px={6} py={4}>
        <FirmwareUpdateBanner onBackFromUpdate={onBackFromUpdate} />
      </Flex>
      <CheckLanguageAvailability />
      <CheckTermOfUseUpdate />
      <TrackScreen category="Wallet" source={source} />
      <CollapsibleHeaderFlatList<JSX.Element>
        data={data}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_HEIGHT }}
        renderItem={({ item }) => item}
        keyExtractor={(_: unknown, index: number) => String(index)}
        showsVerticalScrollIndicator={false}
        testID="PortfolioReadOnlyItems"
      />
    </>
  );
}

export default ReadOnlyPortfolio;

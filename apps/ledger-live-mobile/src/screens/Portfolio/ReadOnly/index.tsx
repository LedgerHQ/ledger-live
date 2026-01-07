import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { LayoutChangeEvent } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useSelector } from "~/context/hooks";
import { Box, Button, Flex } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { useRefreshAccountsOrdering } from "~/actions/general";
import { counterValueCurrencySelector, hasOrderedNanoSelector } from "~/reducers/settings";
import { usePortfolioAllAccounts } from "~/hooks/portfolio";
import GraphCardContainer from "../GraphCardContainer";
import TrackScreen from "~/analytics/TrackScreen";
import { NavigatorName, ScreenName } from "~/const";
import CheckLanguageAvailability from "~/components/CheckLanguageAvailability";
import CheckTermOfUseUpdate from "~/components/CheckTermOfUseUpdate";
import { TAB_BAR_SAFE_HEIGHT } from "~/components/TabBar/TabBarSafeAreaView";
import SetupDeviceBanner from "LLM/features/Reborn/components/SetupDeviceBanner";
import BuyDeviceBanner, {
  IMAGE_PROPS_BUY_DEVICE_FLEX,
} from "LLM/features/Reborn/components/BuyDeviceBanner";
import { AnalyticsContext } from "~/analytics/AnalyticsContext";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { WalletTabNavigatorStackParamList } from "~/components/RootNavigator/types/WalletTabNavigator";
import CollapsibleHeaderFlatList from "~/components/WalletTab/CollapsibleHeaderFlatList";
import usePortfolioAnalyticsOptInPrompt from "~/hooks/analyticsOptInPrompt/usePorfolioAnalyticsOptInPrompt";
import { Asset } from "~/types/asset";
import { useReadOnlyCoins } from "~/hooks/useReadOnlyCoins";
import Assets from "../Assets";
import { UpdateStep } from "~/screens/FirmwareUpdate";
import FirmwareUpdateBanner from "LLM/features/FirmwareUpdate/components/UpdateBanner";

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

  const { sortedCryptoCurrencies } = useReadOnlyCoins({ maxDisplayed: maxAssetsToDisplay });

  const assets: Asset[] = useMemo(
    () =>
      sortedCryptoCurrencies?.map(currency => ({
        amount: 0,
        accounts: [],
        currency,
      })),
    [sortedCryptoCurrencies],
  );

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
        <Assets assets={assets} />
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
      assets,
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
      <CollapsibleHeaderFlatList<React.JSX.Element>
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

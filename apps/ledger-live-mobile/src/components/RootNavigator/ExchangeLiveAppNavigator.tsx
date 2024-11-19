import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { findCryptoCurrencyByKeyword } from "@ledgerhq/live-common/currencies/index";
import { BUY_SELL_UI_APP_ID } from "@ledgerhq/live-common/wallet-api/constants";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { NavigatorName, ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { useTranslation } from "react-i18next";
import styles from "~/navigation/styles";
import type { PtxNavigatorParamList } from "./types/PtxNavigator";
import type { StackNavigatorProps } from "./types/helpers";
import { PtxScreen } from "~/screens/PTX";

const Stack = createStackNavigator<PtxNavigatorParamList>();

const createExchangeScreen =
  (screenName: ScreenName.ExchangeBuy | ScreenName.ExchangeSell) =>
  (
    props: StackNavigatorProps<
      PtxNavigatorParamList,
      ScreenName.ExchangeBuy | ScreenName.ExchangeSell
    >,
  ) => {
    const buySellUiFlag = useFeature("buySellUi");
    const { t } = useTranslation();
    const defaultPlatform = buySellUiFlag?.params?.manifestId || BUY_SELL_UI_APP_ID;
    const {
      defaultAccountId,
      currency,
      defaultCurrencyId,
      goToURL,
      lastScreen,
      platform,
      referrer,
    } = props.route.params || {};
    const resolvedCurrency = currency
      ? findCryptoCurrencyByKeyword(currency)?.id
      : defaultCurrencyId;
    return (
      <PtxScreen
        {...props}
        config={{
          screen: screenName,
          navigator: NavigatorName.Exchange,
          btnText: t("common.quote"),
        }}
        route={{
          ...props.route,
          params: {
            account: defaultAccountId,
            currency: resolvedCurrency,
            goToURL,
            lastScreen,
            platform: platform || defaultPlatform,
            referrer: referrer,
          },
        }}
      />
    );
  };

const ExchangeBuy = createExchangeScreen(ScreenName.ExchangeBuy);
const ExchangeSell = createExchangeScreen(ScreenName.ExchangeSell);

export default function ExchangeLiveAppNavigator() {
  const { colors } = useTheme();

  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator {...stackNavigationConfig}>
      <Stack.Screen
        name={ScreenName.ExchangeBuy}
        options={{
          headerStyle: styles.headerNoShadow,
          title: "",
        }}
      >
        {props => <ExchangeBuy {...props} />}
      </Stack.Screen>

      <Stack.Screen
        name={ScreenName.ExchangeSell}
        options={{
          headerStyle: styles.headerNoShadow,
        }}
      >
        {props => <ExchangeSell {...props} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

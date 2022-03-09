/* eslint-disable import/no-unresolved */
// @flow

import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { ScreenName } from "../../const";
// $FlowFixMe
import MarketList from "../../screens/Market";
// $FlowFixMe
import MarketCurrencySelect from "../../screens/Market/MarketCurrencySelect";
// $FlowFixMe
import MarketDetail from "../../screens/Market/MarketDetail";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";

export default function MarketNavigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );
  return (
    <Stack.Navigator screenOptions={stackNavigationConfig}>
      <Stack.Screen
        name={ScreenName.MarketList}
        component={MarketList}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.MarketCurrencySelect}
        component={MarketCurrencySelect}
        options={{
          headerTitle: t("market.filters.currency"),
        }}
      />
      <Stack.Screen
        name={ScreenName.MarketDetail}
        component={MarketDetail}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();

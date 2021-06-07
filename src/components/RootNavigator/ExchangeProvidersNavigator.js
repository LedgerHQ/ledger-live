// @flow

import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "../../const";
import ExchangeProviders from "../../screens/Exchange/Providers";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import styles from "../../navigation/styles";
import WebPlatformPlayer from "../WebPlatformPlayer";

export default function ExchangeProvidersNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );
  return (
    <Stack.Navigator screenOptions={stackNavigationConfig}>
      <Stack.Screen
        name={ScreenName.ExchangeProviders}
        component={ExchangeProviders}
        options={{
          headerStyle: styles.headerNoShadow,
          title: t("transfer.exchange.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.ExchangeDapp}
        component={WebPlatformPlayer}
        options={({ route }) => ({
          headerStyle: styles.headerNoShadow,
          title: route.params.manifest?.name,
        })}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();

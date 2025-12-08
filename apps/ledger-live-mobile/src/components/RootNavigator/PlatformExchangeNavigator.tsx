import React, { useMemo } from "react";
import { useTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import styles from "~/navigation/styles";
import { ScreenName } from "~/const";
import PlatformStartExchange from "~/screens/Platform/exchange/StartExchange";
import PlatformCompleteExchange from "~/screens/Platform/exchange/CompleteExchange";
import { PlatformExchangeNavigatorParamList } from "./types/PlatformExchangeNavigator";

export default function PlatformExchangeNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator screenOptions={{ ...stackNavigationConfig, headerShown: false }}>
      <Stack.Screen
        name={ScreenName.PlatformStartExchange}
        component={PlatformStartExchange}
        options={{
          title: t("deviceConnect.title"),
          headerShown: true,
          headerRight: undefined,
        }}
      />
      <Stack.Screen
        name={ScreenName.PlatformCompleteExchange}
        component={PlatformCompleteExchange}
        options={{
          headerStyle: styles.headerNoShadow,
          title: t("transfer.swap.landing.header"),
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createNativeStackNavigator<PlatformExchangeNavigatorParamList>();

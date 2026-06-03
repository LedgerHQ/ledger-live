import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "styled-components/native";
import { useTranslation } from "~/context/Locale";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { ScreenName } from "~/const";
import MarketList from "LLM/features/Market/screens/MarketList";
import MarketScreen from "LLM/features/Market/screens/MarketScreen";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { MarketNavigatorStackParamList } from "./Navigator";
import TransparentHeaderNavigationOptions from "~/navigation/TransparentHeaderNavigationOptions";

const Stack = createNativeStackNavigator<MarketNavigatorStackParamList>();

const options = {
  ...TransparentHeaderNavigationOptions,
  headerShown: true,
  headerRight: undefined,
  headerLeft: () => null,
} as const;

export default function MarketWalletTabNavigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { shouldDisplayAssetDiscoverability } = useWalletFeaturesConfig("mobile");
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  const marketScreenOptions = useMemo(() => ({ ...options, title: t("market.exploreTitle") }), [t]);
  return (
    <Stack.Navigator screenOptions={stackNavigationConfig} initialRouteName={ScreenName.MarketList}>
      <Stack.Screen
        name={ScreenName.MarketList}
        component={shouldDisplayAssetDiscoverability ? MarketScreen : MarketList}
        options={shouldDisplayAssetDiscoverability ? marketScreenOptions : options}
      />
    </Stack.Navigator>
  );
}

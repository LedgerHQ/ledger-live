import React, { useMemo } from "react";
import { Platform } from "react-native";
import type { RouteProp } from "@react-navigation/native";
import { useTheme as useLumenTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { ScreenName } from "~/const";
import CurrencyIcon from "~/components/CurrencyIcon";
import {
  createLumenNativeStackNavigator,
  getStackNavigationConfigV4,
} from "LLM/components/Navigation";
import AssetDetail from "./screens/AssetDetail";
import { AssetDetailNavigatorParamsList } from "./types";

const Stack = createLumenNativeStackNavigator<AssetDetailNavigatorParamsList>();

function getAssetDetailOptions({
  route,
}: {
  route: RouteProp<AssetDetailNavigatorParamsList, ScreenName.AssetDetail>;
}) {
  const currency = findCryptoCurrencyById(route.params.currencyId);
  if (!currency) {
    return { title: "" };
  }
  return {
    title: "",
    lumenNavBar: {
      coinCapsule: {
        ticker: currency.ticker,
        icon: <CurrencyIcon currency={currency} size={24} />,
      },
    },
  };
}

export default function AssetDetailNavigator() {
  const { theme } = useLumenTheme();

  const stackNavigationConfig = useMemo(() => getStackNavigationConfigV4(theme), [theme]);

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.AssetDetail}
        component={AssetDetail}
        options={getAssetDetailOptions}
      />
    </Stack.Navigator>
  );
}

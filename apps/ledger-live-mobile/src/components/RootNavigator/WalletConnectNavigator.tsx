import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";

import { ScreenName } from "../../const";
import TransparentHeaderNavigationOptions from "../../navigation/TransparentHeaderNavigationOptions";
import WalletConnectScan from "../../screens/WalletConnect/Scan";
import WalletConnectConnect from "../../screens/WalletConnect/Connect";
import WalletConnectDeeplinkingSelectAccount from "../../screens/WalletConnect/DeeplinkingSelectAccount";
import HeaderRightClose from "../HeaderRightClose";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";

export default function WalletConnectNavigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );

  return (
    <Stack.Navigator screenOptions={stackNavigationConfig}>
      <Stack.Screen
        name={ScreenName.WalletConnectScan}
        component={WalletConnectScan}
        options={{
          ...TransparentHeaderNavigationOptions,
          title: "Wallet Connect",
          headerRight: () => (
            <HeaderRightClose color={colors.white} preferDismiss={false} />
          ),
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name={ScreenName.WalletConnectDeeplinkingSelectAccount}
        component={WalletConnectDeeplinkingSelectAccount}
        options={{
          title: t("walletconnect.deeplinkingTitle"),
          headerRight: () => <HeaderRightClose preferDismiss={false} />,
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name={ScreenName.WalletConnectConnect}
        component={WalletConnectConnect}
        options={{
          title: "Wallet Connect",
          headerLeft: () => null,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();

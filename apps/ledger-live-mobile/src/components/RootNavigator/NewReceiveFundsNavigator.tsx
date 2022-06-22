// @flow
import React, { useMemo } from "react";
import { Platform } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { ScreenName } from "../../const";
import ReceiveConfirmation from "../../screens/ReceiveFunds/03-Confirmation";
import ReceiveConnectDevice from "../../screens/ReceiveFunds/02-ConnectDevice";
import ReceiveSelectCrypto from "../../screens/SelectCrypto";
import ReceiveSelectAccount from "../../screens/SelectAccount";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";

export default function NewReceiveFundsNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );
  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      {/* Select Crypto (see : apps/ledger-live-mobile/src/screens/AddAccounts/01-SelectCrypto.js) */}
      <Stack.Screen
        name={ScreenName.ReceiveSelectCrypto}
        component={ReceiveSelectCrypto}
        options={{ headerLeft: null, headerTitle: () => null }}
      />
      {/* Select Account */}
      <Stack.Screen
        name={ScreenName.ReceiveSelectAccount}
        component={ReceiveSelectAccount}
      />
      {/* Select / Connect Device */}
      <Stack.Screen
        name={ScreenName.ReceiveConnectDevice}
        component={ReceiveConnectDevice}
      />
      {/* Add account(s) automatically */}
      {/* Receive Address */}
      <Stack.Screen
        name={ScreenName.ReceiveConfirmation}
        component={ReceiveConfirmation}
      />
      {/* Receive Address Device Verification */}
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();

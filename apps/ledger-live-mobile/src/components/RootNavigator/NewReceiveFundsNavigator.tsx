// @flow
import React, { useMemo } from "react";
import { Platform } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { ScreenName } from "../../const";
import ReceiveConfirmation from "../../screens/ReceiveFunds/03-Confirmation";
import ReceiveConnectDevice from "../../screens/ReceiveFunds/02-ConnectDevice";
import ReceiveSelectCrypto from "../../screens/ReceiveFunds/01-SelectCrypto";

import ReceiveAddAccountSelectDevice from "../../screens/ReceiveFunds/02-AddAccountSelectDevice";
import ReceiveSelectAccount from "../../screens/ReceiveFunds/02-SelectAccount";
import ReceiveAddAccount from "../../screens/ReceiveFunds/02-AddAccount";

import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";

export default function NewReceiveFundsNavigator() {
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
        options={{
          headerLeft: null,
          headerTitle: "",
        }}
      />

      {/* Select Account */}
      <Stack.Screen
        name={ScreenName.ReceiveSelectAccount}
        component={ReceiveSelectAccount}
        options={{
          headerTitle: "",
        }}
      />

      {/* Select Account */}
      <Stack.Screen
        name={ScreenName.ReceiveAddAccountSelectDevice}
        component={ReceiveAddAccountSelectDevice}
        options={{
          headerTitle: "",
        }}
      />

      {/* Select Account */}
      <Stack.Screen
        name={ScreenName.ReceiveAddAccount}
        component={ReceiveAddAccount}
        options={{
          headerTitle: "",
        }}
      />

      {/* Select / Connect Device */}
      <Stack.Screen
        name={ScreenName.ReceiveConnectDevice}
        component={ReceiveConnectDevice}
        options={{
          headerTitle: "",
        }}
      />
      {/* Add account(s) automatically */}
      {/* Receive Address */}
      <Stack.Screen
        name={ScreenName.ReceiveConfirmation}
        component={ReceiveConfirmation}
        options={{
          headerTitle: "",
        }}
      />
      {/* Receive Address Device Verification */}
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();

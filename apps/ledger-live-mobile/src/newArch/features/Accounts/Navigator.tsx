import React, { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { useRoute } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { track } from "~/analytics";
import type { NetworkBasedAddAccountNavigator } from "LLM/features/Accounts/screens/AddAccount/types";
import SelectAccounts from "LLM/features/Accounts/screens/SelectAccounts";
import { NavigationHeaderCloseButtonAdvanced } from "~/components/NavigationHeaderCloseButton";
import ScanDeviceAccounts from "LLM/features/Accounts/screens/ScanDeviceAccounts";
import { AccountsListNavigator } from "./screens/AccountsList/types";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import AccountsList from "LLM/features/Accounts/screens/AccountsList";

export default function Navigator() {
  const { colors } = useTheme();
  const route = useRoute();
  const accountListUIFF = useFeature("llmAccountListUI");

  const onClose = useCallback(() => {
    track("button_clicked", {
      button: "Close",
      screen: route.name,
    });
  }, [route]);

  const stackNavigationConfig = useMemo(
    () => ({
      ...getStackNavigatorConfig(colors, true),
      headerRight: () => <NavigationHeaderCloseButtonAdvanced onClose={onClose} />,
    }),
    [colors, onClose],
  );

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      {/* Select Accounts */}
      <Stack.Screen
        name={ScreenName.SelectAccounts}
        component={SelectAccounts}
        options={{
          headerTitle: "",
        }}
        initialParams={route.params}
      />

      {/* Scan accounts from device */}
      <Stack.Screen
        name={ScreenName.ScanDeviceAccounts}
        component={ScanDeviceAccounts}
        options={{
          headerTitle: "",
        }}
      />
      {accountListUIFF?.enabled && (
        <Stack.Screen
          name={ScreenName.AccountsList}
          component={AccountsList}
          options={{
            headerTitle: "",
          }}
        />
      )}
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator<NetworkBasedAddAccountNavigator & AccountsListNavigator>();

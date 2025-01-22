import React, { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { track } from "~/analytics";
import type { NetworkBasedAddAccountNavigator } from "LLM/features/Accounts/screens/AddAccount/types";
import ScanDeviceAccounts from "LLM/features/Accounts/screens/ScanDeviceAccounts";
import { AccountsListNavigator } from "./screens/AccountsList/types";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import AccountsList from "LLM/features/Accounts/screens/AccountsList";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";
import AddAccountsSuccess from "./screens/AddAccountSuccess";
import SelectAccounts from "./screens/SelectAccounts";
import AddAccountsWarning from "./screens/AddAccountWarning";
import NoAssociatedAccountsView from "./screens/NoAssociatedAccountsView";
import CloseWithConfirmation from "LLM/components/CloseWithConfirmation";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

export default function Navigator() {
  const { colors } = useTheme();
  const route = useRoute();
  const accountListUIFF = useFeature("llmAccountListUI");
  const navigation = useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();

  const onClose = useCallback(() => {
    track("button_clicked", {
      button: "Close",
      screen: route.name,
    });
    const rootParent = navigation.getParent();
    // this is the only way to go back to the root navigator
    navigation.replace(rootParent?.getState().routeNames[0] as keyof BaseNavigatorStackParamList);
  }, [route, navigation]);

  const stackNavigationConfig = useMemo(
    () => ({
      ...getStackNavigatorConfig(colors, true),
      headerRight: () => <CloseWithConfirmation onClose={onClose} />,
    }),
    [colors, onClose],
  );

  const onPressBack = useCallback(() => {
    track("button_clicked", {
      button: "Back",
      page: route.name,
    });
    navigation.goBack();
  }, [route, navigation]);

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      {/* Scan accounts from device */}
      <Stack.Screen
        name={ScreenName.ScanDeviceAccounts}
        component={ScanDeviceAccounts}
        options={{
          headerTitle: "",
          headerTransparent: true,
        }}
      />
      {/* Select Accounts */}
      <Stack.Screen
        name={ScreenName.SelectAccounts}
        component={SelectAccounts}
        options={{
          headerTitle: "",
        }}
        initialParams={route.params}
      />
      {accountListUIFF?.enabled && (
        <Stack.Screen
          name={ScreenName.AccountsList}
          component={AccountsList}
          options={{
            headerTitle: "",
            headerLeft: () => <NavigationHeaderBackButton onPress={onPressBack} />,
          }}
        />
      )}
      <Stack.Screen
        name={ScreenName.AddAccountsSuccess}
        component={AddAccountsSuccess}
        options={{
          headerTitle: "",
          headerLeft: () => null,
          headerTransparent: true,
        }}
        initialParams={{
          onCloseNavigation: onClose,
        }}
      />
      <Stack.Screen
        name={ScreenName.AddAccountsWarning}
        component={AddAccountsWarning}
        options={{
          headerTitle: "",
          headerLeft: () => null,
          headerTransparent: true,
        }}
        initialParams={{
          onCloseNavigation: onClose,
        }}
      />
      <Stack.Screen
        name={ScreenName.NoAssociatedAccounts}
        component={NoAssociatedAccountsView}
        options={{
          headerTitle: "",
          headerLeft: () => <NavigationHeaderBackButton onPress={onPressBack} />,
          headerTransparent: true,
        }}
        initialParams={{
          onCloseNavigation: onClose,
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator<NetworkBasedAddAccountNavigator & AccountsListNavigator>();

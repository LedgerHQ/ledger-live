import React, { useCallback, useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "styled-components/native";
import { useSelector } from "~/context/store";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { ScreenName } from "~/const";
import Accounts from "~/screens/Accounts";
import Account from "~/screens/Account";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import ReadOnlyAccounts from "~/screens/Accounts/ReadOnly/ReadOnlyAccounts";
import ReadOnlyAssets from "~/screens/Portfolio/ReadOnlyAssets";

import Asset from "~/screens/WalletCentricAsset";
import ReadOnlyAsset from "~/screens/WalletCentricAsset/ReadOnly";
import Assets from "~/screens/Assets";

import ReadOnlyAccount from "~/screens/Account/ReadOnly/ReadOnlyAccount";

import type { AccountsNavigatorParamList } from "./types/AccountsNavigator";
import { hasNoAccountsSelector } from "~/reducers/accounts";
import AccountsList from "LLM/features/Accounts/screens/AccountsList";
import { NavigationHeaderBackButton } from "../NavigationHeaderBackButton";
import { track } from "~/analytics";
import { NavigationProp, NavigationState, useNavigation, useRoute } from "@react-navigation/native";
import { TrackingEvent } from "LLM/features/Accounts/enums";
import AccountsListHeaderRight from "LLM/features/LedgerSyncEntryPoint/components/AccountsListHeaderRight";

const Stack = createNativeStackNavigator<AccountsNavigatorParamList>();

type NavType = Omit<NavigationProp<ReactNavigation.RootParamList>, "getState"> & {
  getState(): NavigationState | undefined;
};

type ParamsType = {
  params?: { specificAccounts?: object[] };
};

const isParamsType = (value: unknown): value is ParamsType =>
  typeof value === "object" &&
  value !== null &&
  Object.prototype.hasOwnProperty.call(value, "params");

export default function AccountsNavigator() {
  const { colors } = useTheme();
  const stackNavConfig = useMemo(() => getStackNavigatorConfig(colors), [colors]);

  const route = useRoute();
  const navigation = useNavigation();

  const hasNoAccounts = useSelector(hasNoAccountsSelector);
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector) && hasNoAccounts;

  const onPressBack = useCallback(
    (nav: NavType) => {
      // Needed since we use the same screen for different purposes
      const maybeParams = navigation.getState()?.routes?.[1]?.params;
      const hasSpecificAccounts =
        isParamsType(maybeParams) && Boolean(maybeParams.params?.specificAccounts);
      const screenName = hasSpecificAccounts
        ? TrackingEvent.AccountListSummary
        : TrackingEvent.AccountsList;
      track("button_clicked", {
        button: "Back",
        page: screenName || route.name,
      });
      nav.goBack();
    },
    [navigation, route.name],
  );

  return (
    <Stack.Navigator screenOptions={stackNavConfig}>
      <Stack.Screen
        name={ScreenName.Accounts}
        component={readOnlyModeEnabled ? ReadOnlyAccounts : Accounts}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.Account}
        component={readOnlyModeEnabled ? ReadOnlyAccount : Account}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ScreenName.Assets}
        component={readOnlyModeEnabled ? ReadOnlyAssets : Assets}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.AccountsList}
        component={AccountsList}
        options={{
          headerTitle: "",
          headerLeft: () => <NavigationHeaderBackButton onPress={onPressBack} />,
          headerRight: () => <AccountsListHeaderRight />,
        }}
      />
      <Stack.Screen
        name={ScreenName.Asset}
        component={readOnlyModeEnabled ? ReadOnlyAsset : Asset}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

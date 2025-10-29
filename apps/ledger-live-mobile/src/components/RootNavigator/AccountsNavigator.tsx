import React, { useCallback, useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { useSelector } from "react-redux";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { ScreenName } from "~/const";
import Accounts from "~/screens/Accounts";
import Account from "~/screens/Account";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import type { AccountsNavigatorParamList } from "./types/AccountsNavigator";
import { hasNoAccountsSelector } from "~/reducers/accounts";
import AccountsList from "LLM/features/Accounts/screens/AccountsList";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { NavigationHeaderBackButton } from "../NavigationHeaderBackButton";
import { track } from "~/analytics";
import { NavigationProp, NavigationState, useNavigation, useRoute } from "@react-navigation/native";
import { TrackingEvent } from "LLM/features/Accounts/enums";
import LedgerSyncEntryPoint from "LLM/features/LedgerSyncEntryPoint";
import { EntryPoint } from "LLM/features/LedgerSyncEntryPoint/types";
import { register } from "react-native-bundle-splitter";

const ReadOnlyAccounts = register({
  loader: () => import("~/screens/Accounts/ReadOnly/ReadOnlyAccounts"),
});
const ReadOnlyAssets = register({ loader: () => import("~/screens/Portfolio/ReadOnlyAssets") });
const Asset = register({ loader: () => import("~/screens/WalletCentricAsset") });
const ReadOnlyAsset = register({ loader: () => import("~/screens/WalletCentricAsset/ReadOnly") });
const Assets = register({ loader: () => import("~/screens/Assets") });
const ReadOnlyAccount = register({
  loader: () => import("~/screens/Account/ReadOnly/ReadOnlyAccount"),
});

const Stack = createStackNavigator<AccountsNavigatorParamList>();

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
  const accountListUIFF = useFeature("llmAccountListUI");
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
      {accountListUIFF?.enabled && (
        <Stack.Screen
          name={ScreenName.AccountsList}
          component={AccountsList}
          options={{
            headerTitle: "",
            headerLeft: () => <NavigationHeaderBackButton onPress={onPressBack} />,
            headerRight: () => (
              <LedgerSyncEntryPoint entryPoint={EntryPoint.accounts} page="Accounts" />
            ),
          }}
        />
      )}
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

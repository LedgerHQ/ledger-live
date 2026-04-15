import React, { useCallback, useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "styled-components/native";
import { useTheme as useLumenTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { useSelector } from "~/context/hooks";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { ScreenName } from "~/const";
import Accounts from "~/screens/Accounts";
import Account from "~/screens/Account";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { getStackNavigationConfigV4 } from "LLM/components/Navigation/getStackNavigationConfigV4";
import ReadOnlyAccounts from "~/screens/Accounts/ReadOnly/ReadOnlyAccounts";
import ReadOnlyAssets from "~/screens/Portfolio/ReadOnlyAssets";

import Asset from "~/screens/WalletCentricAsset";
import ReadOnlyAsset from "~/screens/WalletCentricAsset/ReadOnly";
import Assets from "~/screens/Assets";

import ReadOnlyAccount from "~/screens/Account/ReadOnly/ReadOnlyAccount";

import type { AccountsNavigatorParamList } from "./types/AccountsNavigator";
import { hasNoAccountsSelector } from "~/reducers/accounts";
import AccountsList from "LLM/features/Accounts/screens/AccountsList";
import { CryptoScreen } from "LLM/features/Crypto";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { NavigationHeaderBackButton } from "../NavigationHeaderBackButton";
import { track } from "~/analytics";
import { NavigationProp, NavigationState, useNavigation, useRoute } from "@react-navigation/native";
import { TrackingEvent } from "LLM/features/Accounts/enums";
import AccountsListHeaderRight from "LLM/features/LedgerSyncEntryPoint/components/AccountsListHeaderRight";
import { CryptoAddressesScreen } from "LLM/features/CryptoAddresses";

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
  const { theme: lumenTheme } = useLumenTheme();
  const stackNavConfig = useMemo(() => getStackNavigatorConfig(colors), [colors]);
  const stackNavConfigV4 = useMemo(() => getStackNavigationConfigV4(lumenTheme), [lumenTheme]);
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
            headerRight: () => <AccountsListHeaderRight />,
          }}
        />
      )}
      <Stack.Screen
        name={ScreenName.CryptoAddresses}
        component={CryptoAddressesScreen}
        options={{ headerShown: false, ...stackNavConfigV4 }}
      />
      <Stack.Screen
        name={ScreenName.Crypto}
        component={CryptoScreen}
        options={{ headerShown: false, ...stackNavConfigV4 }}
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

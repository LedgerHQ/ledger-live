import React, { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "styled-components/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { track } from "~/analytics";
import type { NetworkBasedAddAccountNavigator } from "LLM/features/Accounts/screens/AddAccount/types";
import ScanDeviceAccounts from "LLM/features/Accounts/screens/ScanDeviceAccounts";
import { AccountsListNavigator } from "./screens/AccountsList/types";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import AccountsList from "LLM/features/Accounts/screens/AccountsList";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";
import AddAccountsSuccess from "./screens/AddAccountSuccess";
import AddAccountsWarning from "./screens/AddAccountWarning";
import NoAssociatedAccountsView from "./screens/NoAssociatedAccountsView";
import CloseWithConfirmation from "LLM/components/CloseWithConfirmation";
import {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";

import useAnalytics from "LLM/hooks/useAnalytics";
import { AddAccountsNavigatorParamList } from "~/components/RootNavigator/types/AddAccountsNavigator";
import { AnalyticContexts } from "LLM/hooks/useAnalytics/enums";
import LedgerSyncEntryPoint from "LLM/features/LedgerSyncEntryPoint";
import { EntryPoint } from "LLM/features/LedgerSyncEntryPoint/types";
import TransparentHeaderNavigationOptions from "~/navigation/TransparentHeaderNavigationOptions";

type NavigationProps = BaseComposite<
  StackNavigatorProps<AddAccountsNavigatorParamList, NavigatorName.AddAccounts>
>;
export default function Navigator() {
  const { colors } = useTheme();
  const route = useRoute<NavigationProps["route"]>();
  const accountListUIFF = useFeature("llmAccountListUI");
  const navigation = useNavigation<StackNavigatorNavigation<AddAccountsNavigatorParamList>>();

  const { analyticsMetadata } = useAnalytics(AnalyticContexts.AddAccounts);

  const exitProcess = useCallback(() => {
    const rootParent = navigation.getParent();
    if (rootParent) {
      // Navigate to the first route instead of replace to ensure proper screen lifecycle
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rootParent.navigate(rootParent.getState().routeNames[0] as any);
    }
  }, [navigation]);

  const onClose = useCallback(() => {
    track("button_clicked", {
      button: "Close",
      screen: route.name,
    });
    exitProcess();
  }, [route, exitProcess]);

  const onExitScanDeviceAccounts = useCallback(() => {
    const clickMetadata = analyticsMetadata[ScreenName.ScanDeviceAccounts]?.onClose;
    track(clickMetadata?.eventName, clickMetadata?.payload);
    exitProcess();
  }, [exitProcess, analyticsMetadata]);

  const onBackScanDeviceAccounts = useCallback(() => {
    const clickMetadata = analyticsMetadata[ScreenName.ScanDeviceAccounts]?.onBack;
    track(clickMetadata?.eventName, clickMetadata?.payload);
    navigation.goBack();
  }, [navigation, analyticsMetadata]);

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
          ...TransparentHeaderNavigationOptions,
          headerRight: () => <CloseWithConfirmation onClose={onExitScanDeviceAccounts} />,
          headerLeft: () => <NavigationHeaderBackButton onPress={onBackScanDeviceAccounts} />,
        }}
      />
      {/* Select Accounts */}

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
        name={ScreenName.AddAccountsSuccess}
        component={AddAccountsSuccess}
        options={{
          ...TransparentHeaderNavigationOptions,
          headerLeft: () => null,
        }}
        initialParams={{
          onCloseNavigation: onClose,
        }}
      />
      <Stack.Screen
        name={ScreenName.AddAccountsWarning}
        component={AddAccountsWarning}
        options={{
          ...TransparentHeaderNavigationOptions,
          headerLeft: () => null,
        }}
        initialParams={{
          onCloseNavigation: onClose,
        }}
      />
      <Stack.Screen
        name={ScreenName.NoAssociatedAccounts}
        component={NoAssociatedAccountsView}
        options={{
          ...TransparentHeaderNavigationOptions,
          headerLeft: () => <NavigationHeaderBackButton onPress={onPressBack} />,
        }}
        initialParams={{
          onCloseNavigation: onClose,
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createNativeStackNavigator<NetworkBasedAddAccountNavigator & AccountsListNavigator>();

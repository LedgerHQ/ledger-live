import React, { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { useTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import TransparentHeaderNavigationOptions from "~/navigation/TransparentHeaderNavigationOptions";
import { NavigationHeaderCloseButtonAdvanced } from "~/components/NavigationHeaderCloseButton";
import { Trans } from "~/context/Locale";
import type {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import { AleoAddAccountParamList, AleoViewKeyFlowParamList } from "./types";
import ViewKeyWarningScreen from "./ViewKeyWarningScreen";
import ViewKeyApproveScreen from "./ViewKeyApproveScreen";
import NoAccountsAddedScreen from "./NoAccountsAddedScreen";

type Props = StackNavigatorProps<AleoAddAccountParamList, ScreenName.AleoAddAccount>;

const Stack = createNativeStackNavigator<AleoViewKeyFlowParamList>();

const DEFAULT_ADD_ACCOUNT_FLOW_DEPTH = 2; // SelectDevice + AddAccounts

interface HeaderRightProps {
  onClose: () => void;
  withConfirmation?: boolean;
}

function HeaderRight({ onClose, withConfirmation = true }: Readonly<HeaderRightProps>) {
  return (
    <NavigationHeaderCloseButtonAdvanced
      withConfirmation={withConfirmation}
      skipNavigation
      onClose={onClose}
      confirmationTitle={<Trans i18nKey="addAccounts.quitConfirmation.v2.title" />}
      confirmButtonText={<Trans i18nKey="addAccounts.quitConfirmation.v2.cancel" />}
      rejectButtonText={<Trans i18nKey="addAccounts.quitConfirmation.v2.continue" />}
      cancelCTAConfig={{ type: "primary", outline: true }}
      customDrawerStyle={{
        title: {
          textAlign: "left",
          fontSize: 18,
          fontWeight: "600",
          lineHeight: 32.4,
          letterSpacing: -0.72,
          marginBottom: 16,
          marginTop: -45,
        },
      }}
    />
  );
}

function AddAccountNavigator({ route, navigation }: Readonly<Props>) {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, false), [colors]);
  // AleoViewKeyApprove requires a non-empty accountsToAdd; fall back to the warning screen
  // rather than letting ViewKeyApproveScreen mount with an invalid navigation state.
  const hasAccountsToAdd = Array.isArray(route.params.accountsToAdd)
    ? route.params.accountsToAdd.length > 0
    : false;
  const initialRouteName =
    route.params.initialRouteName === ScreenName.AleoViewKeyApprove && !hasAccountsToAdd
      ? ScreenName.AleoViewKeyWarning
      : (route.params.initialRouteName ?? ScreenName.AleoViewKeyWarning);
  const navigationDepth = route.params.navigationDepth;
  const handleClose = useCallback(() => {
    const parent = navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>();
    parent?.pop(navigationDepth ?? DEFAULT_ADD_ACCOUNT_FLOW_DEPTH);
  }, [navigation, navigationDepth]);

  const renderHeaderRight = useCallback(() => <HeaderRight onClose={handleClose} />, [handleClose]);
  const renderHeaderRightNoConfirmation = useCallback(
    () => <HeaderRight onClose={handleClose} withConfirmation={false} />,
    [handleClose],
  );

  const { accountsToAdd: _, ...viewKeyWarningParams } = route.params;

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
        // Default close pops only one parent screen; pop(navigationDepth) exits the full add-account stack.
        headerRight: renderHeaderRight,
      }}
    >
      <Stack.Screen
        name={ScreenName.AleoViewKeyWarning}
        component={ViewKeyWarningScreen}
        initialParams={{ ...viewKeyWarningParams, onCloseNavigation: handleClose }}
        options={{ headerTitle: "" }}
      />
      <Stack.Screen
        name={ScreenName.AleoViewKeyApprove}
        component={ViewKeyApproveScreen}
        initialParams={{ ...route.params, onCloseNavigation: handleClose }}
        options={{ headerTitle: "", headerLeft: () => null, gestureEnabled: false }}
      />
      <Stack.Screen
        name={ScreenName.AleoNoAccountsAdded}
        component={NoAccountsAddedScreen}
        initialParams={{ ...viewKeyWarningParams, onCloseNavigation: handleClose }}
        options={{
          ...TransparentHeaderNavigationOptions,
          headerLeft: () => null,
          headerRight: renderHeaderRightNoConfirmation,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}

const options = {
  headerShown: false,
};
export { AddAccountNavigator as component, options };

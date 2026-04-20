import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useMemo } from "react";
import { useTheme } from "styled-components/native";
import { NavigatorName, ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { BorrowLiveAppNavigatorParamList } from "./types/BorrowLiveAppNavigator";
import { BorrowLiveAppWrapper } from "LLM/features/Borrow";
import type { BaseComposite, StackNavigatorProps } from "./types/helpers";

const Stack = createNativeStackNavigator<BorrowLiveAppNavigatorParamList>();

type NavigationProps = BaseComposite<
  StackNavigatorProps<BorrowLiveAppNavigatorParamList, ScreenName.Borrow>
>;

type BorrowNavigation = NavigationProp<ParamListBase>;

const Borrow = (props: NavigationProps) => {
  const paramAction = props.route.params?.action;
  const navigation: BorrowNavigation = props.navigation as unknown as BorrowNavigation;

  const triggerGoBackAction = useCallback(() => {
    navigation.navigate(NavigatorName.Borrow, {
      screen: ScreenName.Borrow,
      params: {
        ...props.route.params,
        action: "go-back",
      },
    });
  }, [navigation, props.route.params]);

  const clearDeepLink = useCallback(() => {
    navigation.setParams({ action: undefined });
  }, [navigation]);

  const goBackNative = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    // If there is no previous native screen, stay in Borrow and let the app reload its root step.
    navigation.navigate(NavigatorName.Borrow, {
      screen: ScreenName.Borrow,
      params: {
        ...props.route.params,
        action: undefined,
      },
    });
  }, [navigation, props.route.params]);

  useEffect(() => {
    if (!paramAction || paramAction === "go-back") {
      return;
    }

    console.warn(`BorrowLiveAppNavigator: No route for action "${paramAction}"`);
    clearDeepLink();
  }, [clearDeepLink, paramAction]);

  return (
    <BorrowLiveAppWrapper
      action={paramAction}
      onNativeGoBack={goBackNative}
      onActionHandled={clearDeepLink}
      onWalletApiGoBack={triggerGoBackAction}
    />
  );
};

export default function BorrowLiveAppNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator screenOptions={{ ...stackNavigationConfig }}>
      <Stack.Screen
        name={ScreenName.Borrow}
        component={Borrow}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
